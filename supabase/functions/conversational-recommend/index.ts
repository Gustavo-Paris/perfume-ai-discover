
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Processing conversational recommendation:', { message, historyLength: conversationHistory?.length });

    // Get perfume catalog
    const { data: perfumes, error: perfumesError } = await supabase
      .from('perfumes')
      .select('*');

    if (perfumesError) {
      throw new Error('Failed to fetch perfumes');
    }

    const availablePerfumes = perfumes?.filter(p => 
      (p.price_5ml && p.price_5ml > 0) || (p.price_10ml && p.price_10ml > 0)
    ) || [];

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
2. EXPLORAR GRADUALMENTE:
   - Gênero e ocasiões de uso
   - Preferências de intensidade
   - Famílias olfativas que gosta/não gosta
   - IMPORTANTE: Pergunte sobre perfumes que já provou e gostou/não gostou
   - Orçamento (de forma sutil)
   - Personalidade e estilo
3. APROFUNDAR: Faça perguntas específicas baseadas nas respostas
4. ANÁLISE: Quando tiver informações suficientes, diga "Perfeito! Deixe-me analisar suas preferências e encontrar os perfumes ideais para você..."
5. FINALIZAR: Apresente as 3 recomendações mais precisas

QUANDO RECOMENDAR:
- Após 5-7 trocas de mensagens
- Quando entender bem o perfil do cliente
- SEMPRE pergunte sobre experiências passadas com perfumes
- Priorize QUALIDADE sobre quantidade nas recomendações

APÓS AS RECOMENDAÇÕES:
- O cliente pode continuar a conversa se não gostar das sugestões
- Pergunte especificamente o que não agradou nas recomendações anteriores
- Explore novos aspectos do perfil do cliente
- Faça novas recomendações baseadas no feedback
- Mantenha o tom consultivo e acolhedor

CATÁLOGO DISPONÍVEL:
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
})), null, 2)}

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

    // Call OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.8,
        messages: messages,
        max_tokens: 400
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0].message.content;

    console.log('AI Response:', aiResponse);

    // Check if AI wants to make recommendations
    const shouldRecommend = aiResponse.toLowerCase().includes('deixe-me analisar') || 
                           aiResponse.toLowerCase().includes('analisar suas preferências') ||
                           aiResponse.toLowerCase().includes('encontrar os perfumes ideais') ||
                           (conversationHistory.length >= 10 && !isContinuation);

    let recommendations: string[] = [];
    let isComplete = false;

    if (shouldRecommend) {
      // Generate recommendations based on conversation
      const recommendationPrompt = `Baseado nesta conversa detalhada sobre preferências de perfume, escolha apenas os 3 perfumes que mais precisamente combinam com o cliente.

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

Responda APENAS com um array JSON de 3 IDs dos perfumes mais precisos. Exemplo: ["id1", "id2", "id3"]`;

      const recResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.2,
          messages: [
            { role: 'system', content: 'Você é um especialista em perfumaria que escolhe perfumes com máxima precisão baseado em conversas. Responda apenas com arrays JSON de IDs.' },
            { role: 'user', content: recommendationPrompt }
          ],
          max_tokens: 150
        }),
      });

      if (recResponse.ok) {
        const recData = await recResponse.json();
        const recContent = recData.choices[0].message.content.trim();
        
        try {
          const parsedRecs = JSON.parse(recContent);
          if (Array.isArray(parsedRecs)) {
            recommendations = parsedRecs.slice(0, 3);
            isComplete = true;
          }
        } catch (e) {
          console.log('Failed to parse recommendations, using fallback');
          recommendations = availablePerfumes.slice(0, 3).map(p => p.id);
          isComplete = true;
        }
      }
    }

    const result = {
      content: aiResponse,
      isComplete,
      recommendations: recommendations.length > 0 ? recommendations : undefined
    };

    console.log('Conversation result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in conversational-recommend function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
