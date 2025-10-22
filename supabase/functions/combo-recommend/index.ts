import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Retry with exponential backoff
async function retryWithBackoff(fn: () => Promise<any>, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`Attempt ${attempt + 1} failed:`, errorMessage);
      
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Call Lovable AI with retry
async function callLovableAI(messages: any[], temperature = 0.3, maxTokens = 1000) {
  return await retryWithBackoff(async () => {
    console.log('Calling Lovable AI Gateway (Gemini) for combo analysis...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        temperature,
        messages,
        max_tokens: maxTokens
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Lovable AI error ${response.status}:`, errorText);
      
      if (response.status === 429) {
        throw new Error('RATE_LIMIT: Muitas solicitações.');
      } else if (response.status === 402) {
        throw new Error('PAYMENT_REQUIRED: Créditos insuficientes.');
      } else if (response.status >= 500) {
        throw new Error('Serviço de IA temporariamente indisponível.');
      } else {
        throw new Error(`Erro na API: ${response.status}`);
      }
    }

    return await response.json();
  }, 3, 2000);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const requestBody = await req.json();
    const { conversationHistory, budget, recommendedPerfumes } = requestBody;
    
    console.log('Processing combo recommendation:', { 
      budget, 
      perfumeCount: recommendedPerfumes?.length || 0,
      historyLength: conversationHistory?.length || 0 
    });

    if (!lovableApiKey) {
      console.error('Lovable API key not configured');
      return new Response(JSON.stringify({ 
        error: 'Serviço de IA não configurado.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get perfume details
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

    // Get additional perfumes from same families if needed
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

    // Enhanced prompt with complementarity and dynamic sizing
    const comboPrompt = `Você é um especialista em perfumaria criando combos inteligentes e complementares.

ORÇAMENTO: R$ ${budget}
CONVERSA: ${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}

PERFUMES DISPONÍVEIS:
${JSON.stringify(perfumeDetails.slice(0, 15).map(p => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      family: p.family,
      gender: p.gender,
      intensity: p.intensity,
      top_notes: p.top_notes,
      heart_notes: p.heart_notes,
      base_notes: p.base_notes,
      price_5ml: p.price_5ml,
      price_10ml: p.price_10ml,
      price_full: p.price_full
    })), null, 2)}

REGRAS DE COMPLEMENTARIDADE:
1. VARIEDADE OLFATIVA: Famílias diferentes em cada combo (amadeirado + cítrico + floral)
2. INTENSIDADES BALANCEADAS: Combine suave (dia) + intenso (noite)
3. VERSATILIDADE: Perfumes para diferentes ocasiões (trabalho + festa + casual)
4. PROGRESSÃO: Leve → Médio → Intenso dentro do combo

LÓGICA DINÂMICA DE TAMANHOS POR ORÇAMENTO:
- < R$ 150: 3x 5ml (variedade máxima)
- R$ 150-250: 2x 10ml + 1x 5ml (equilíbrio)
- R$ 250-400: 1x 10ml + 2x 10ml (generoso)
- > R$ 400: 1x 100ml + 2x 10ml (frasco completo + testes)

REGRAS OBRIGATÓRIAS (VIOLAÇÃO = COMBO REJEITADO):
1. ⚠️ MÍNIMO 85% do orçamento DEVE ser usado (com R$ ${budget}, MÍNIMO R$ ${Math.round(budget * 0.85)})
2. ⚠️ MÍNIMO 3 perfumes por combo (ideal: 4 perfumes)
3. ⚠️ NUNCA repita perfume_id dentro de um combo
4. ⚠️ Use tamanhos variados para otimizar: misture 5ml, 10ml e ocasionalmente 100ml
5. ⚠️ Cada perfume aparece UMA ÚNICA VEZ por combo

EXEMPLO DE COMBO VÁLIDO para R$ 300:
{
  "items": [
    {"perfume_id": "uuid-1", "size_ml": 10, "price": 58.84},
    {"perfume_id": "uuid-2", "size_ml": 10, "price": 56.22},
    {"perfume_id": "uuid-3", "size_ml": 10, "price": 62.50},
    {"perfume_id": "uuid-4", "size_ml": 10, "price": 73.30}
  ],
  "total": 250.86  // ✅ 83.6% do orçamento - VÁLIDO!
}

❌ COMBO INVÁLIDO (será rejeitado automaticamente):
{
  "items": [
    {"perfume_id": "uuid-1", "size_ml": 10, "price": 58.84},
    {"perfume_id": "uuid-2", "size_ml": 10, "price": 56.22}
  ],
  "total": 115.06  // ❌ Apenas 38% do orçamento - INACEITÁVEL!
}

FORMATO DE RESPOSTA (JSON válido):
⚠️ GERE EXATAMENTE 2-3 COMBOS DIFERENTES com estratégias variadas:
- Combo 1: "Versátil" (mix de intensidades para todas as ocasiões)
- Combo 2: "Premium" (foco em qualidade, pode usar 100ml)
- Combo 3: "Descoberta" (máxima variedade, apenas 5ml ou 10ml)

{
  "combos": [
    {
      "id": "combo1",
      "name": "Combo Versátil",
      "description": "Mix de intensidades para todas as ocasiões",
      "items": [
        {"perfume_id": "id1", "size_ml": 10, "price": 58.84},
        {"perfume_id": "id2", "size_ml": 10, "price": 56.22},
        {"perfume_id": "id3", "size_ml": 10, "price": 62.50}
      ],
      "total": 177.56,
      "occasions": ["dia", "trabalho", "noite"],
      "complementarity_score": 0.92
    },
    {
      "id": "combo2",
      "name": "Combo Premium",
      "description": "Foco em qualidade com frasco completo",
      "items": [
        {"perfume_id": "id4", "size_ml": 100, "price": 180.00},
        {"perfume_id": "id5", "size_ml": 10, "price": 65.00}
      ],
      "total": 245.00,
      "occasions": ["especial", "presente"],
      "complementarity_score": 0.88
    }
  ]
}`;

    console.log('Calling Lovable AI for combo generation...');
    
    const comboData = await callLovableAI([
      { 
        role: 'system', 
        content: 'Você é um especialista em curadoria de perfumes. Responda APENAS com JSON válido.' 
      },
      { role: 'user', content: comboPrompt }
    ], 0.1, 1500);
    
    let comboContent = comboData.choices[0].message.content.trim();
    console.log('Raw AI response:', comboContent.substring(0, 200) + '...');
    
    // Clean up response
    comboContent = comboContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    const firstBrace = comboContent.indexOf('{');
    const lastBrace = comboContent.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
      comboContent = comboContent.substring(firstBrace, lastBrace + 1);
    }
    
    console.log('Cleaned content:', comboContent.substring(0, 200) + '...');
    
    try {
      const parsedCombos = JSON.parse(comboContent);
      console.log('Successfully parsed combos JSON');
      
      if (parsedCombos.combos && Array.isArray(parsedCombos.combos)) {
        // Enrich combos with full perfume data and validate
        const enrichedCombos = parsedCombos.combos.map((combo: any) => {
          // Remove duplicates from items using Set
          const seenIds = new Set<string>();
          const uniqueItems = combo.items?.filter((item: any) => {
            if (seenIds.has(item.perfume_id)) {
              console.warn(`⚠️ Removendo perfume duplicado do combo "${combo.name}": ${item.perfume_id}`);
              return false;
            }
            seenIds.add(item.perfume_id);
            return true;
          }) || [];
          
          const enrichedItems = uniqueItems.map((item: any) => {
            const perfume = perfumeDetails.find(p => p.id === item.perfume_id);
            if (!perfume) {
              console.warn(`⚠️ Perfume not found for ID: ${item.perfume_id}`);
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
          }).filter(Boolean) || [];
          
          // Recalculate total to ensure accuracy
          const recalculatedTotal = enrichedItems.reduce((sum: number, item: any) => sum + (item.price || 0), 0);
          
          // Log detailed validation
          const budgetPercent = ((recalculatedTotal / budget) * 100).toFixed(1);
          const avgPricePerItem = enrichedItems.length > 0 ? (recalculatedTotal / enrichedItems.length).toFixed(2) : 0;
          
          console.log('📊 Combo Analysis:', {
            comboName: combo.name,
            itemCount: enrichedItems.length,
            uniqueIds: new Set(enrichedItems.map((i: any) => i.perfume_id)).size,
            total: recalculatedTotal.toFixed(2),
            budget: budget,
            percentUsed: budgetPercent + '%',
            avgPricePerItem: avgPricePerItem,
            passesMinimumItems: enrichedItems.length >= 3,
            passesMinimumBudget: recalculatedTotal >= budget * 0.70,
            withinBudget: recalculatedTotal <= budget
          });
          
          // Warn if totals don't match
          if (Math.abs(recalculatedTotal - (combo.total || 0)) > 0.01) {
            console.warn(`⚠️ Total corrigido para "${combo.name}": ${combo.total} → ${recalculatedTotal}`);
          }
          
          return {
            ...combo,
            items: enrichedItems,
            total: recalculatedTotal
          };
        }).filter((combo: any) => {
          // Rigorous validation: minimum 3 items and 70% budget usage
          const isValid = 
            combo.items.length >= 3 &&
            combo.total <= budget &&
            combo.total >= budget * 0.70;
          
          if (!isValid) {
            const percentUsed = ((combo.total / budget) * 100).toFixed(1);
            console.warn(`⚠️ Combo "${combo.name}" REJEITADO:`, {
              items: combo.items.length,
              total: combo.total.toFixed(2),
              budget: budget,
              percentUsed: percentUsed + '%',
              reason: combo.items.length < 3 
                ? 'Poucos itens (mínimo: 3)' 
                : `Orçamento mal aproveitado (usado: ${percentUsed}%, mínimo: 70%)`
            });
          }
          return isValid;
        });

        const maxComboValue = enrichedCombos.length > 0 ? Math.max(...enrichedCombos.map((c: any) => c.total)) : 0;
        console.log('Generated combos successfully:', enrichedCombos.length);

        return new Response(JSON.stringify({ 
          combos: enrichedCombos,
          budget_used: maxComboValue
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        console.error('Invalid combo structure');
        throw new Error('Invalid combo structure from AI');
      }
    } catch (parseError) {
      console.error('Failed to parse combo JSON:', parseError);
      
      // Enhanced fallback with complementarity logic
      console.log('Creating enhanced fallback combos...');
      const fallbackCombos = [];
      
      // Separate by intensity for better combinations
      const lightPerfumes = perfumeDetails.filter(p => 
        p.intensity?.toLowerCase().includes('suave') || p.intensity?.toLowerCase().includes('leve')
      );
      const intensePerfumes = perfumeDetails.filter(p => 
        p.intensity?.toLowerCase().includes('intenso') || p.intensity?.toLowerCase().includes('forte')
      );
      const mediumPerfumes = perfumeDetails.filter(p => 
        !lightPerfumes.includes(p) && !intensePerfumes.includes(p)
      );

      // Create combo with variety - minimum 3 perfumes
      if (perfumeDetails.length >= 3) {
        const targetItemCount = Math.floor(budget / 60); // ~R$60 per perfume
        const minItems = Math.max(3, Math.min(targetItemCount, perfumeDetails.length));
        
        let currentTotal = 0;
        const items = [];
        const usedIds = new Set<string>();
        
        // Try to include different intensities
        const selections = [
          lightPerfumes[0] || perfumeDetails[0],
          intensePerfumes[0] || perfumeDetails[1],
          mediumPerfumes[0] || perfumeDetails[2],
          perfumeDetails[3],
          perfumeDetails[4]
        ].filter(Boolean);
        
        for (const perfume of selections) {
          if (items.length >= minItems) break;
          if (usedIds.has(perfume.id)) continue;
          
          // Intelligent size selection based on remaining budget
          const remaining = budget - currentTotal;
          let selectedSize = 10;
          let selectedPrice = perfume.price_10ml || 0;
          
          // Use 100ml if budget allows and it's first/second item
          if (remaining > 150 && items.length < 2 && perfume.price_full && perfume.price_full < remaining * 0.4) {
            selectedSize = 100;
            selectedPrice = perfume.price_full;
          } 
          // Use 5ml for small budgets or final items
          else if (remaining < 70 && perfume.price_5ml) {
            selectedSize = 5;
            selectedPrice = perfume.price_5ml;
          }
          // Default to 10ml
          else if (perfume.price_10ml) {
            selectedSize = 10;
            selectedPrice = perfume.price_10ml;
          }
          // Fallback to 5ml if 10ml not available
          else if (perfume.price_5ml) {
            selectedSize = 5;
            selectedPrice = perfume.price_5ml;
          } else {
            continue; // Skip if no valid price
          }
          
          if (currentTotal + selectedPrice <= budget) {
            items.push({
              perfume_id: perfume.id,
              size_ml: selectedSize,
              price: selectedPrice,
              perfume: {
                id: perfume.id,
                name: perfume.name,
                brand: perfume.brand,
                image_url: perfume.image_url
              }
            });
            usedIds.add(perfume.id);
            currentTotal += selectedPrice;
          }
        }
        
        console.log('📦 Fallback combo created:', {
          itemCount: items.length,
          total: currentTotal.toFixed(2),
          budget: budget,
          percentUsed: ((currentTotal / budget) * 100).toFixed(1) + '%',
          sizes: items.map(i => i.size_ml + 'ml').join(', ')
        });

        if (items.length >= 3) {
          fallbackCombos.push({
            id: 'fallback1',
            name: 'Combo Versátil',
            description: 'Seleção complementar com diferentes intensidades para todas as ocasiões',
            items: items,
            total: currentTotal,
            occasions: ['versatil', 'dia', 'noite'],
            complementarity_score: 0.75
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
    console.error('Error in combo-recommend:', error);
    
    let errorMessage = 'Erro interno. Tente novamente.';
    let statusCode = 500;
    const errorString = error instanceof Error ? error.message : String(error);
    
    if (errorString.includes('RATE_LIMIT')) {
      errorMessage = 'Muitas solicitações. Aguarde um momento.';
      statusCode = 429;
    } else if (errorString.includes('PAYMENT_REQUIRED')) {
      errorMessage = 'Créditos insuficientes. Adicione em Settings → Workspace → Usage.';
      statusCode = 402;
    } else if (errorString.includes('indisponível')) {
      errorMessage = 'Serviço de IA temporariamente indisponível.';
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
