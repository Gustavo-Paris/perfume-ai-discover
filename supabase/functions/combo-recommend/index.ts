import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para fazer retry com backoff exponencial
async function retryWithBackoff(fn: () => Promise<any>, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`Attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Função para chamar OpenAI com retry
async function callOpenAI(messages: any[], temperature = 0.3, maxTokens = 300) {
  return await retryWithBackoff(async () => {
    console.log('Calling OpenAI API for combo analysis...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature,
        messages,
        max_tokens: maxTokens
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error ${response.status}:`, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI configuration.');
      } else if (response.status >= 500) {
        throw new Error('OpenAI service temporarily unavailable. Please try again.');
      } else {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
    }

    return await response.json();
  }, 3, 2000);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { conversationHistory, budget, recommendedPerfumes } = requestBody;
    
    console.log('Processing combo recommendation:', { 
      budget, 
      perfumeCount: recommendedPerfumes?.length || 0,
      historyLength: conversationHistory?.length || 0 
    });

    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({ 
        error: 'Serviço de IA não configurado. Entre em contato com o suporte.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get perfume details for recommendations
    let perfumeDetails = [];
    if (recommendedPerfumes && recommendedPerfumes.length > 0) {
      const { data: perfumes, error: perfumesError } = await supabase
        .from('perfumes')
        .select('*')
        .in('id', recommendedPerfumes);

      if (perfumesError) {
        console.error('Error fetching perfume details:', perfumesError);
        throw new Error('Erro ao buscar detalhes dos perfumes');
      }

      perfumeDetails = perfumes || [];
    }

    // Get additional perfumes from same families/preferences if needed
    if (perfumeDetails.length < 5) {
      const families = [...new Set(perfumeDetails.map(p => p.family))];
      const genders = [...new Set(perfumeDetails.map(p => p.gender))];
      
      const { data: additionalPerfumes } = await supabase
        .from('perfumes')
        .select('*')
        .or(`family.in.(${families.join(',')}),gender.in.(${genders.join(',')})`)
        .not('id', 'in', `(${recommendedPerfumes.join(',')})`)
        .limit(10);

      if (additionalPerfumes) {
        perfumeDetails = [...perfumeDetails, ...additionalPerfumes.slice(0, 5)];
      }
    }

    console.log(`Working with ${perfumeDetails.length} perfumes for combo analysis`);

    // Generate smart combos based on conversation and budget
    const comboPrompt = `Você é um especialista em perfumaria que cria combos otimizados para USAR QUASE TODO O ORÇAMENTO.

ORÇAMENTO: R$ ${budget}
CONVERSA: ${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}

PERFUMES DISPONÍVEIS (${perfumeDetails.length} opções):
${JSON.stringify(perfumeDetails.slice(0, 15).map(p => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      family: p.family,
      gender: p.gender,
      price_5ml: p.price_5ml,
      price_10ml: p.price_10ml,
      price_full: p.price_full
    })), null, 2)}

REGRAS CRÍTICAS:
1. Use 85-98% do orçamento (máximo R$ 20 de sobra!)
2. Se orçamento ≥ R$ 400: inclua pelo menos 1 frasco de 100ml
3. Se orçamento R$ 200-399: foque em 10ml + alguns 5ml
4. Se orçamento < R$ 200: use principalmente 5ml e 10ml
5. Cada combo deve ter 2-4 perfumes complementares
6. Varie intensidades e ocasiões de uso
7. Crie 2-3 combos diferentes

IMPORTANTE: Responda APENAS com JSON válido, sem texto adicional:
{
  "combos": [
    {
      "id": "combo1",
      "name": "Nome do Combo",
      "description": "Descrição do combo e por que faz sentido",
      "items": [
        {"perfume_id": "id", "size_ml": 10, "price": 45.90},
        {"perfume_id": "id2", "size_ml": 5, "price": 29.90}
      ],
      "total": 75.80,
      "occasions": ["dia", "trabalho"]
    }
  ]
}`;

    console.log('Calling OpenAI for combo generation...');
    
    const comboData = await callOpenAI([
      { 
        role: 'system', 
        content: 'Você é um especialista em curadoria de perfumes que cria combos inteligentes baseados em conversas e orçamento. Responda APENAS com JSON válido, sem texto adicional.' 
      },
      { role: 'user', content: comboPrompt }
    ], 0.3, 1000);
    
    let comboContent = comboData.choices[0].message.content.trim();
    console.log('Raw AI response:', comboContent.substring(0, 200) + '...');
    
    // Clean up response - remove markdown code blocks if present
    comboContent = comboContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find JSON content between first { and last }
    const firstBrace = comboContent.indexOf('{');
    const lastBrace = comboContent.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
      comboContent = comboContent.substring(firstBrace, lastBrace + 1);
    }
    
    console.log('Cleaned content for parsing:', comboContent.substring(0, 200) + '...');
    
    try {
      const parsedCombos = JSON.parse(comboContent);
      console.log('Successfully parsed combos JSON');
      
      if (parsedCombos.combos && Array.isArray(parsedCombos.combos)) {
        // Validate and enrich combos with full perfume data
        const enrichedCombos = parsedCombos.combos.map((combo: any) => {
          const enrichedItems = combo.items?.map((item: any) => {
            const perfume = perfumeDetails.find(p => p.id === item.perfume_id);
            if (!perfume) {
              console.log(`Perfume not found for ID: ${item.perfume_id}`);
              return null;
            }
            return {
              ...item,
              perfume: {
                id: perfume.id,
                name: perfume.name,
                brand: perfume.brand,
                image_url: perfume.image_url
              }
            };
          }).filter(Boolean) || []; // Remove items without perfume data
          
          return {
            ...combo,
            items: enrichedItems,
            total: enrichedItems.reduce((sum: number, item: any) => sum + (item.price || 0), 0)
          };
        }).filter((combo: any) => combo.items.length >= 2 && combo.total <= budget);

        const maxComboValue = enrichedCombos.length > 0 ? Math.max(...enrichedCombos.map(c => c.total)) : 0;
        console.log('Generated combos successfully:', enrichedCombos.length);

        return new Response(JSON.stringify({ 
          combos: enrichedCombos,
          budget_used: maxComboValue
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        console.error('Invalid combo structure - missing combos array');
        throw new Error('Invalid combo structure from AI');
      }
    } catch (parseError) {
      console.error('Failed to parse combo JSON:', parseError);
      console.error('Content that failed to parse:', comboContent);
      
      // Fallback: create simple combos based on available perfumes
      console.log('Creating fallback combos...');
      const fallbackCombos = [];
      
      // Get perfumes within budget for 5ml
      const affordablePerfumes = perfumeDetails
        .filter(p => p.price_5ml && p.price_5ml > 0 && p.price_5ml <= budget * 0.6)
        .sort((a, b) => (a.price_5ml || 0) - (b.price_5ml || 0))
        .slice(0, 6);

      if (affordablePerfumes.length >= 2) {
        let currentTotal = 0;
        const items = [];
        
        for (const perfume of affordablePerfumes.slice(0, 3)) {
          const price = perfume.price_5ml || 0;
          if (currentTotal + price <= budget * 0.9) {
            items.push({
              perfume_id: perfume.id,
              size_ml: 5,
              price: price,
              perfume: {
                id: perfume.id,
                name: perfume.name,
                brand: perfume.brand,
                image_url: perfume.image_url
              }
            });
            currentTotal += price;
          }
        }

        if (items.length >= 2) {
          fallbackCombos.push({
            id: 'fallback1',
            name: 'Combo Descoberta',
            description: 'Seleção diversificada para explorar novos aromas baseada em suas preferências',
            items: items,
            total: currentTotal,
            occasions: ['versatil']
          });
        }
      }

      console.log('Generated fallback combos:', fallbackCombos.length);

      return new Response(JSON.stringify({ 
        combos: fallbackCombos,
        budget_used: fallbackCombos.length > 0 ? fallbackCombos[0].total : 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in combo-recommend function:', error);
    
    let errorMessage = 'Erro interno do servidor. Tente novamente.';
    let statusCode = 500;
    
    if (error.message.includes('Rate limit exceeded')) {
      errorMessage = 'Muitas solicitações. Aguarde um momento e tente novamente.';
      statusCode = 429;
    } else if (error.message.includes('Invalid API key')) {
      errorMessage = 'Configuração da IA inválida. Entre em contato com o suporte.';
      statusCode = 401;
    } else if (error.message.includes('service temporarily unavailable')) {
      errorMessage = 'Serviço de IA temporariamente indisponível. Tente novamente em alguns minutos.';
      statusCode = 503;
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});