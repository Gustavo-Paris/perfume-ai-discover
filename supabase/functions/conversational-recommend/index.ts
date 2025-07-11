
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      
      // Backoff exponencial: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Função para chamar OpenAI com retry
async function callOpenAI(messages: any[], temperature = 0.8, maxTokens = 400) {
  return await retryWithBackoff(async () => {
    console.log('Calling OpenAI API...');
    
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
  }, 3, 2000); // 3 tentativas, começando com 2s de delay
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();
    
    console.log('Processing conversational recommendation:', { 
      message: message?.substring(0, 50) + '...', 
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

    // Get perfume catalog with error handling
    let availablePerfumes = [];
    try {
      const { data: perfumes, error: perfumesError } = await supabase
        .from('perfumes')
        .select('*')
        .limit(50); // Limitar para evitar payload muito grande

      if (perfumesError) {
        console.error('Error fetching perfumes:', perfumesError);
        throw new Error('Erro ao buscar catálogo de perfumes');
      }

      availablePerfumes = perfumes?.filter(p => 
        (p.price_5ml && p.price_5ml > 0) || (p.price_10ml && p.price_10ml > 0)
      ) || [];

      console.log(`Loaded ${availablePerfumes.length} available perfumes`);
    } catch (error) {
      console.error('Failed to fetch perfumes:', error);
      // Continue sem catálogo em caso de erro
      availablePerfumes = [];
    }

    // Build conversation context
    const conversationContext = conversationHistory?.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    })) || [];

    // Check if this is a continuation after recommendations
    const isContinuation = message.includes('viu as 3 recomendações') || 
                          message.includes('Continue a conversa');

    // System prompt for conversational curation
    const systemPrompt = `Você é um especialista em perfumaria brasileiro que faz curadoria personalizada através de conversas naturais e fluidas.

SEU OBJETIVO: Descobrir as preferências do cliente através de uma conversa envolvente e recomendar os 3 perfumes mais precisos para ele.

ESTILO DE CONVERSA:
- Seja caloroso, acolhedor e genuinamente interessado
- Faça perguntas que fluem naturalmente da resposta anterior
- Use linguagem brasileira informal mas sofisticada
- Seja um consultor experiente, não um robô

PROCESSO DE DESCOBERTA:
1. INÍCIO: Cumprimente e pergunte sobre a busca (para si ou presente)
2. EXPLORAR GRADUALMENTE (PERGUNTAS ESSENCIAIS):
   - Gênero da pessoa que vai usar (masculino/feminino/unissex)
   - Faixa etária aproximada (jovem, adulto, maduro)
   - Orçamento disponível para investir (R$ 50-200, R$ 200-500, mais de R$ 500)
   - Ocasiões de uso (trabalho, festa, dia a dia, especiais)
   - Preferências de intensidade (suave, moderado, marcante)
   - Famílias olfativas que gosta/não gosta
   - IMPORTANTE: Pergunte sobre perfumes que já provou e gostou/não gostou
   - Personalidade e estilo
3. APROFUNDAR: Faça perguntas específicas baseadas nas respostas
4. ANÁLISE: Quando tiver informações SUFICIENTES (gênero, pelo menos 2 preferências e contexto de uso), diga "Perfeito! Deixe-me analisar suas preferências e encontrar os perfumes ideais para você..."

REGRAS CRÍTICAS:
- NUNCA finalize a conversa sem ter informações ESSENCIAIS (gênero, preferências básicas, contexto)
- Se o usuário perguntar sobre continuar de onde parou, responda de forma natural e continue o processo
- Mantenha conversas fluidas e personalizadas
- SEMPRE retorne EXATAMENTE 3 recomendações (nunca menos, nunca mais)
- Se não conseguir 3 perfumes únicos, expanda critérios mas mantenha 3 diferentes
- Baseie recomendações nas informações coletadas
- Use nomes de perfumes reais do banco de dados
- Seja prestativo e educativo sobre fragrâncias

APÓS AS RECOMENDAÇÕES:
- O cliente pode continuar a conversa se não gostar das sugestões
- Pergunte especificamente o que não agradou nas recomendações anteriores
- Explore novos aspectos do perfil do cliente
- Faça novas recomendações baseadas no feedback
- Mantenha o tom consultivo e acolhedor

${availablePerfumes.length > 0 ? `CATÁLOGO DISPONÍVEL:
${JSON.stringify(availablePerfumes.slice(0, 20).map(p => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  family: p.family,
  gender: p.gender,
  description: p.description,
  top_notes: p.top_notes,
  heart_notes: p.heart_notes,
  base_notes: p.base_notes
})), null, 2)}` : 'CATÁLOGO: Temporariamente indisponível, mas posso ajudar com recomendações gerais.'}

REGRAS:
- NUNCA mencione que é uma IA
- Não faça listas de perguntas
- Uma pergunta por vez
- Seja genuinamente curioso
- SEMPRE pergunte sobre experiências passadas
- Adapte-se às respostas
- Se o cliente não gostou das recomendações, explore mais profundamente suas preferências`;

    // Prepare messages for OpenAI
    let messages = [
      { role: 'system', content: systemPrompt },
      ...conversationContext
    ];

    // If it's a continuation, don't add the system message as user message
    if (!isContinuation) {
      messages.push({ role: 'user', content: message });
    } else {
      // Add context for continuation
      messages.push({ 
        role: 'system', 
        content: 'O usuário acabou de ver as 3 recomendações mas gostaria de explorar outras opções. Pergunte especificamente o que não agradou nas sugestões para refinar ainda mais as recomendações.' 
      });
    }

    console.log('Sending to OpenAI with messages:', messages.length);

    // Call OpenAI with retry logic
    const openaiData = await callOpenAI(messages);
    const aiResponse = openaiData.choices[0].message.content;

    console.log('AI Response received successfully');

    // Check if AI wants to make recommendations
    const shouldRecommend = aiResponse.toLowerCase().includes('deixe-me analisar') || 
                           aiResponse.toLowerCase().includes('analisar suas preferências') ||
                           aiResponse.toLowerCase().includes('encontrar os perfumes ideais') ||
                           (conversationHistory.length >= 10 && !isContinuation);

    let recommendations: string[] = [];
    let isComplete = false;

    // If should recommend, first send transition message
    if (shouldRecommend && availablePerfumes.length > 0) {
      // Return transition message first
      if (aiResponse.toLowerCase().includes('deixe-me analisar') || 
          aiResponse.toLowerCase().includes('analisar suas preferências')) {
        return new Response(JSON.stringify({
          content: aiResponse,
          isComplete: false,
          needsRecommendations: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Check if this is a follow-up request for actual recommendations
    const isRecommendationRequest = message === 'gerar recomendações' || 
                                   conversationHistory.some(msg => 
                                     msg.content?.toLowerCase().includes('gerar recomendações') ||
                                     msg.content?.toLowerCase().includes('fazer recomendações')
                                   );

    // Also check if conversation seems complete and should recommend
    const conversationSeemsComplete = conversationHistory.length >= 8 && 
                                      !isContinuation &&
                                      !shouldRecommend &&
                                      (aiResponse.toLowerCase().includes('que você acha') ||
                                      aiResponse.toLowerCase().includes('chamou sua atenção') ||
                                      aiResponse.toLowerCase().includes('gostou das opções') ||
                                      aiResponse.toLowerCase().includes('te abraçar') ||
                                      aiResponse.toLowerCase().includes('algo mais que você gostaria'));

    if ((isRecommendationRequest || conversationSeemsComplete) && availablePerfumes.length > 0) {
      try {
        // Generate recommendations based on conversation
        const recommendationPrompt = `Baseado nesta conversa detalhada sobre preferências de perfume, escolha entre 3 a 5 perfumes que mais precisamente combinam com o cliente.

Conversa completa:
${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}
${!isContinuation ? `Última mensagem: ${message}` : ''}

Catálogo disponível:
${JSON.stringify(availablePerfumes.map(p => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  family: p.family,
  gender: p.gender,
  description: p.description,
  top_notes: p.top_notes,
  heart_notes: p.heart_notes,
  base_notes: p.base_notes
})), null, 2)}

CRITÉRIOS DE SELEÇÃO:
- Máxima precisão baseada nas preferências reveladas
- Considere experiências passadas mencionadas
- Priorize qualidade da combinação sobre quantidade
- Ordene do mais adequado para o menos adequado
- Retorne entre 3 a 5 perfumes (idealmente 3-4, mas pode ser até 5 se houver múltiplas opções excelentes)

Responda APENAS com um array JSON de 3-5 IDs dos perfumes mais precisos. Exemplo: ["id1", "id2", "id3"] ou ["id1", "id2", "id3", "id4", "id5"]`;

        const recData = await callOpenAI([
          { role: 'system', content: 'Você é um especialista em perfumaria que escolhe perfumes com máxima precisão baseado em conversas. Responda apenas com arrays JSON de IDs.' },
          { role: 'user', content: recommendationPrompt }
        ], 0.2, 150);
        
        const recContent = recData.choices[0].message.content.trim();
        
        try {
          const parsedRecs = JSON.parse(recContent);
          if (Array.isArray(parsedRecs)) {
            recommendations = parsedRecs.slice(0, 5); // Allow up to 5 recommendations
            isComplete = true;
            console.log('Recommendations generated:', recommendations);
          }
        } catch (e) {
          console.log('Failed to parse recommendations, using fallback');
          recommendations = availablePerfumes.slice(0, 3).map(p => p.id);
          isComplete = true;
        }
      } catch (error) {
        console.error('Error generating recommendations:', error);
        // Continue without recommendations
      }
    }

    // Se temos recomendações, não enviamos resposta de conversa adicional
    const result = {
      content: recommendations.length > 0 ? '' : aiResponse,
      isComplete,
      recommendations: recommendations.length > 0 ? recommendations : undefined
    };

    console.log('Conversation result:', { 
      hasContent: !!result.content, 
      isComplete: result.isComplete, 
      hasRecommendations: !!result.recommendations 
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in conversational-recommend function:', error);
    
    // Determine error type and provide appropriate message
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
