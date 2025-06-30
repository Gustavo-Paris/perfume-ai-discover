
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

    // System prompt for conversational curation
    const systemPrompt = `Você é um especialista em perfumaria brasileiro que faz curadoria personalizada através de conversas naturais e fluidas.

SEU OBJETIVO: Descobrir as preferências do cliente através de uma conversa envolvente e recomendar perfumes perfeitos para ele.

ESTILO DE CONVERSA:
- Seja caloroso, acolhedor e genuinamente interessado
- Faça perguntas que fluem naturalmente da resposta anterior
- Use linguagem brasileira informal mas sofisticada
- Seja um consultor experiente, não um robô

PROCESSO:
1. INÍCIO: Cumprimente e pergunte sobre a busca (para si ou presente)
2. EXPLORAR: Descubra gradualmente:
   - Gênero e ocasiões de uso
   - Preferências de intensidade
   - Famílias olfativas que gosta/não gosta
   - Experiências passadas com perfumes
   - Orçamento (de forma sutil)
   - Personalidade e estilo
3. APROFUNDAR: Faça perguntas específicas baseadas nas respostas
4. FINALIZAR: Quando tiver informações suficientes, diga que encontrou perfumes perfeitos

QUANDO RECOMENDAR:
- Após 4-6 trocas de mensagens
- Quando entender bem o perfil do cliente
- Diga: "Perfeito! Com base em nossa conversa, encontrei algumas fragrâncias que combinam perfeitamente com você."

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
- Adapte-se às respostas`;

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationContext,
      { role: 'user', content: message }
    ];

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
    const shouldRecommend = aiResponse.toLowerCase().includes('encontrei') || 
                           aiResponse.toLowerCase().includes('recomendo') ||
                           aiResponse.toLowerCase().includes('perfeito') ||
                           conversationHistory.length >= 8;

    let recommendations: string[] = [];
    let isComplete = false;

    if (shouldRecommend) {
      // Generate recommendations based on conversation
      const recommendationPrompt = `Baseado nesta conversa sobre preferências de perfume, escolha 5 perfumes que melhor combinam com o cliente.

Conversa:
${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}
Última mensagem: ${message}

Catálogo:
${JSON.stringify(availablePerfumes.map(p => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  family: p.family,
  gender: p.gender,
  description: p.description
})), null, 2)}

Responda APENAS com um array JSON de IDs dos perfumes, ordenados do melhor para o cliente. Exemplo: ["id1", "id2", "id3", "id4", "id5"]`;

      const recResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.3,
          messages: [
            { role: 'system', content: 'Você é um especialista em perfumaria que escolhe perfumes baseado em conversas. Responda apenas com arrays JSON de IDs.' },
            { role: 'user', content: recommendationPrompt }
          ],
          max_tokens: 200
        }),
      });

      if (recResponse.ok) {
        const recData = await recResponse.json();
        const recContent = recData.choices[0].message.content.trim();
        
        try {
          const parsedRecs = JSON.parse(recContent);
          if (Array.isArray(parsedRecs)) {
            recommendations = parsedRecs.slice(0, 5);
            isComplete = true;
          }
        } catch (e) {
          console.log('Failed to parse recommendations, using fallback');
          recommendations = availablePerfumes.slice(0, 5).map(p => p.id);
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
