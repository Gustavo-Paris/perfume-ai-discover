import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { answers } = await req.json();
    
    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured');
    }

    console.log('Processing recommendation with answers:', answers);

    // Get all perfumes with stock
    const { data: perfumes, error: perfumesError } = await supabase
      .from('perfumes')
      .select('*');

    if (perfumesError) {
      throw new Error('Failed to fetch perfumes');
    }

    const availablePerfumes = perfumes?.filter(p => 
      (p.price_5ml && p.price_5ml > 0) || (p.price_10ml && p.price_10ml > 0)
    ) || [];

    // Create catalog for AI
    const catalog = availablePerfumes.map(p => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      family: p.family,
      gender: p.gender,
      description: p.description,
      top_notes: p.top_notes,
      heart_notes: p.heart_notes,
      base_notes: p.base_notes,
      intensity: p.intensity,
      price_5ml: p.price_5ml,
      price_10ml: p.price_10ml
    }));

    // Enhanced prompt with balancing rules
    const systemPrompt = `Você é um especialista em perfumaria fazendo recomendações precisas e balanceadas.

REGRAS DE BALANCEAMENTO OBRIGATÓRIAS:
1. VARIEDADE DE PREÇOS: Inclua pelo menos 1 opção acessível (menor preço) e opções variadas
2. DIVERSIDADE DE MARCAS: Máximo 2 perfumes da mesma marca
3. INTENSIDADE VARIADA: Combine intensidades diferentes (suave, médio, intenso)
4. OCASIÕES DIVERSAS: Perfumes para diferentes momentos (dia, noite, trabalho, festa)
5. EVITE SIMILARIDADE ALTA: Nunca recomende perfumes com >60% das mesmas notas

PONDERAÇÃO DE CRITÉRIOS:
- Personalidade e preferências do usuário: 40% (PRIORIDADE MÁXIMA)
- Ocasião de uso mencionada: 30%
- Diversidade e variedade: 30%

VALIDAÇÕES OBRIGATÓRIAS (antes de retornar):
✓ Pelo menos 3 marcas diferentes
✓ Variação de preço de pelo menos 30% entre menor e maior
✓ Pelo menos 2 intensidades diferentes
✓ Respeito absoluto ao gênero preferido
✓ Nenhuma família olfativa que o usuário disse NÃO gostar

FORMATO DE RESPOSTA:
Use JSON Schema para garantir estrutura válida:
{
  "perfume_ids": ["id1", "id2", "id3"],
  "reasoning": "Breve explicação do balanceamento",
  "diversity_score": 0.85
}`;

    const prompt = `Analise as preferências do usuário e escolha 3-5 perfumes balanceados:

PREFERÊNCIAS DO USUÁRIO:
- Gênero: ${answers.gender}
- Família Olfativa: ${answers.family}
- Ocasião: ${answers.occasion}
- Intensidade: ${answers.intensity}
- Orçamento: ${answers.budget}
- Preferências adicionais: ${answers.preferences}

CATÁLOGO COMPLETO:
${JSON.stringify(catalog, null, 2)}

Retorne JSON com perfume_ids, reasoning e diversity_score.`;

    console.log('Calling Lovable AI Gateway (Gemini)...');

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        temperature: 0.3, // Lower temperature for precision
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Lovable AI error ${response.status}:`, errorText);
      
      if (response.status === 429) {
        throw new Error('RATE_LIMIT: Muitas solicitações.');
      } else if (response.status === 402) {
        throw new Error('PAYMENT_REQUIRED: Créditos insuficientes.');
      }
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content.trim();
    
    console.log('AI Response:', aiResponse);

    // Parse AI response
    let perfumeIds: string[];
    let diversityScore = 0;
    let reasoning = '';
    
    try {
      const parsed = JSON.parse(aiResponse);
      perfumeIds = parsed.perfume_ids || parsed.perfumeIds || [];
      diversityScore = parsed.diversity_score || 0;
      reasoning = parsed.reasoning || '';
      
      if (!Array.isArray(perfumeIds)) {
        throw new Error('Invalid response format');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      // Fallback: extract IDs from text
      const matches = aiResponse.match(/"([a-f0-9-]{36})"/g);
      if (matches) {
        perfumeIds = matches.map((m: string) => m.replace(/"/g, '')).slice(0, 5);
      } else {
        perfumeIds = availablePerfumes.slice(0, 5).map(p => p.id);
      }
    }

    // Validate and filter IDs
    const validIds = perfumeIds.filter(id => 
      availablePerfumes.some(p => p.id === id)
    ).slice(0, 5);

    // Calculate quality metrics for logging
    const recommendedPerfumes = availablePerfumes.filter(p => validIds.includes(p.id));
    const brands = new Set(recommendedPerfumes.map(p => p.brand));
    const families = new Set(recommendedPerfumes.map(p => p.family));
    const prices = recommendedPerfumes.map(p => p.price_5ml || p.price_10ml || 0);
    const priceRange = prices.length > 0 ? (Math.max(...prices) - Math.min(...prices)) / Math.min(...prices) : 0;

    const qualityMetrics = {
      brand_diversity: brands.size,
      family_diversity: families.size,
      price_range_percent: priceRange,
      diversity_score: diversityScore,
      reasoning: reasoning
    };

    console.log('Quality Metrics:', qualityMetrics);

    const result = { 
      perfumeIds: validIds,
      quality_metrics: qualityMetrics
    };

    // Get user ID from auth header if available
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || null;
      } catch (authError) {
        console.log('No valid auth token provided');
      }
    }

    // Save recommendation session with metrics
    const { error: sessionError } = await supabase
      .from('recommendation_sessions')
      .insert({
        user_id: userId,
        answers_json: answers,
        recommended_json: result,
        ai_provider_id: null // Using Lovable AI
      });

    if (sessionError) {
      console.error('Failed to save session:', sessionError);
    }

    console.log('Recommendation completed:', result);

    return new Response(JSON.stringify({ perfumeIds: validIds }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in recommend function:', error);
    
    const errorString = error instanceof Error ? error.message : String(error);
    let statusCode = 500;
    let userMessage = 'Erro interno. Tente novamente.';
    
    if (errorString.includes('RATE_LIMIT')) {
      userMessage = 'Muitas solicitações. Aguarde um momento.';
      statusCode = 429;
    } else if (errorString.includes('PAYMENT_REQUIRED')) {
      userMessage = 'Créditos insuficientes. Adicione em Settings → Workspace → Usage.';
      statusCode = 402;
    }
    
    return new Response(
      JSON.stringify({ error: userMessage }), {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
