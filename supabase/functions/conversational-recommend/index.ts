import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Retry function with exponential backoff
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

// Call Lovable AI Gateway with retry
async function callLovableAI(messages: any[], temperature = 0.7, maxTokens = 400) {
  return await retryWithBackoff(async () => {
    console.log('Calling Lovable AI Gateway (Gemini)...');
    
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
        throw new Error('RATE_LIMIT: Muitas solicitações. Aguarde um momento.');
      } else if (response.status === 402) {
        throw new Error('PAYMENT_REQUIRED: Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage.');
      } else if (response.status === 401) {
        throw new Error('Chave de API inválida.');
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
    const { message, conversationHistory } = await req.json();
    
    console.log('Processing conversational recommendation:', { 
      message: message?.substring(0, 50) + '...', 
      historyLength: conversationHistory?.length || 0 
    });

    if (!lovableApiKey) {
      console.error('Lovable API key not configured');
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
        .limit(50);

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
      availablePerfumes = [];
    }

    // Build conversation context
    const conversationContext = conversationHistory?.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    })) || [];

    // Check if this is a continuation after recommendations or a request to generate
    const isContinuation = message.includes('viu as 3 recomendações') || 
                          message.includes('Continue a conversa');
    const isGenerateRequest = message.toLowerCase().includes('gerar recomendações');

    // Enhanced system prompt with few-shot examples
    const systemPrompt = `Você é um especialista mundial em perfumaria com décadas de experiência, conhecido por fazer curadorias perfeitas que impressionam os clientes.

SEU OBJETIVO: Descobrir profundamente as preferências do cliente através de uma conversa envolvente e recomendar perfumes PERFEITOS baseados nas suas necessidades específicas.

ESTILO DE CONVERSA:
- Seja caloroso, acolhedor e genuinamente interessado nas preferências
- Faça perguntas que fluem naturalmente da resposta anterior
- Use linguagem brasileira informal mas sofisticada
- Seja um consultor experiente e perspicaz, não um robô

FEW-SHOT EXAMPLES (aprenda com estes exemplos):

EXEMPLO 1 - BOA CONVERSA:
Cliente: "Quero um perfume para o dia a dia"
Consultor: "Perfeito! Para te ajudar melhor, me conta: esse perfume é pra você ou é um presente? E você prefere algo mais discreto e fresh ou gosta de fragrâncias que deixam uma presença mais marcante?"
[✓ Natural, contextual, explora preferências]

Cliente: "É pra mim, gosto de algo marcante"
Consultor: "Ótimo! E quando você pensa em 'marcante', que tipo de aroma te atrai? Aromas amadeirados e intensos tipo um bom oudh, ou você prefere algo doce e envolvente tipo âmbar com baunilha?"
[✓ Explora intensidade E família olfativa]

EXEMPLO 2 - CONVERSA RUIM (NÃO FAÇA ISSO):
Cliente: "Quero um perfume"
Consultor: "Qual sua faixa de preço?"
[✗ Pergunta sobre preço muito cedo, não é natural]

Cliente: "Até R$200"
Consultor: "Prefere masculino ou feminino?"
[✗ Muito robotizado, não contextualiza]

PROCESSO DE DESCOBERTA INTELIGENTE:
1. INÍCIO: Cumprimente e pergunte sobre a busca (para si ou presente)
2. MAPEAMENTO PROFUNDO (CRITÉRIOS DE COMPLETUDE):
   ✓ Gênero identificado (masculino/feminino/unissex)
   ✓ Pelo menos 2 ocasiões de uso conhecidas
   ✓ Noção de intensidade desejada (suave/moderado/marcante)
   ✓ Família olfativa preferida OU perfumes de referência
   ✓ Orçamento aproximado (pode ser inferido indiretamente)
   
3. ANÁLISE INTELIGENTE: Quando tiver TODOS os 5 critérios acima, diga EXATAMENTE:
   "Perfeito! Com base em tudo que me contou, vou agora fazer uma análise completa das suas preferências e buscar as melhores opções no nosso catálogo. Isso levará apenas alguns instantes..."

PERGUNTAS ESTRATÉGICAS:
- "Você tem algum perfume que já usa e ama? O que te atrai nele?"
- "Tem algum cheiro que você definitivamente NÃO gosta?"
- "Onde você imagina usando esse perfume? Trabalho, festas, dia a dia?"
- "Você prefere algo mais discreto ou gosta quando as pessoas percebem seu perfume?"

EXPERTISE EM PERFUMARIA:
- Conheça famílias olfativas, notas, DNA olfativo de perfumes famosos
- Identifique inspirações, clones, versões similares entre marcas
- Entenda progressão olfativa (saída, coração, fundo)
- Reconheça características de diferentes casas perfumísticas
- Saiba combinar preferências pessoais com perfis olfativos

REGRAS CRÍTICAS:
- NUNCA liste perfumes ou recomendações no texto da conversa
- NUNCA pergunte sobre orçamento diretamente - descubra indiretamente
- NUNCA finalize sem ter os 5 critérios de completude
- Se o usuário mencionar perfumes específicos, EXPLORE profundamente o que gostou
- ADAPTE suas perguntas baseado nas respostas anteriores
- Seja GENUINAMENTE curioso sobre as preferências olfativas
- Uma pergunta por vez, bem contextualizada

APÓS AS RECOMENDAÇÕES:
- O cliente pode continuar se não gostar das sugestões
- Pergunte especificamente o que não agradou
- Explore aspectos que podem ter passado despercebidos
- Use feedback para refinar ainda mais o perfil

${availablePerfumes.length > 0 ? `CATÁLOGO DISPONÍVEL (primeiros 30):
${JSON.stringify(availablePerfumes.slice(0, 30).map(p => ({
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
  longevity: p.longevity,
  price_5ml: p.price_5ml,
  price_10ml: p.price_10ml
})), null, 2)}` : 'CATÁLOGO: Temporariamente indisponível'}

REGRAS FINAIS:
- NUNCA mencione ser uma IA
- Demonstre expertise real em perfumaria
- Faça recomendações que IMPRESSIONEM pela precisão`;

    // Prepare messages
    let messages = [
      { role: 'system', content: systemPrompt },
      ...conversationContext
    ];

    if (!isContinuation) {
      messages.push({ role: 'user', content: message });
    } else {
      messages.push({ 
        role: 'system', 
        content: 'O usuário acabou de ver as recomendações mas gostaria de explorar outras opções. Pergunte especificamente o que não agradou para refinar.' 
      });
    }

    console.log('Sending to Lovable AI with messages:', messages.length);

    // Call Lovable AI
    const aiData = await callLovableAI(messages, 0.7, 400);
    const aiResponse = aiData.choices[0].message.content;

    console.log('AI Response received successfully');

    // Check if AI wants to make recommendations OR if it's a direct generate request
    const shouldRecommend = isGenerateRequest ||
                           aiResponse.toLowerCase().includes('vou agora fazer uma análise completa') || 
                           aiResponse.toLowerCase().includes('deixe-me analisar') || 
                           aiResponse.toLowerCase().includes('analisar suas preferências') ||
                           aiResponse.toLowerCase().includes('buscar as melhores opções') ||
                           (conversationHistory.length >= 10 && !isContinuation);

    let recommendations: string[] = [];
    let isComplete = false;

    // If it's a direct generate request, skip the transition and go straight to recommendations
    if (isGenerateRequest && availablePerfumes.length > 0) {
      console.log('Direct generate request detected, generating recommendations immediately');
      
      try {
        const userProfile = conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n');
        
        const recommendationMessages = [
          { role: 'system', content: `Você é um mestre perfumista analisando preferências para recomendar perfumes.

INSTRUÇÕES CRÍTICAS:
- Retorne APENAS um array JSON de IDs
- Formato: ["id1", "id2", "id3"]
- Recomende entre 3 a 5 perfumes que fazem SENTIDO PERFEITO para o perfil
- RESPEITE absolutamente gênero e preferências mencionadas
- NUNCA ignore famílias que o usuário disse não gostar` },
          { role: 'user', content: `PERFIL COMPLETO:
${userProfile}

CATÁLOGO:
${JSON.stringify(availablePerfumes.map(p => ({ 
  id: p.id, 
  name: p.name, 
  brand: p.brand, 
  family: p.family, 
  gender: p.gender,
  top_notes: p.top_notes,
  heart_notes: p.heart_notes,
  base_notes: p.base_notes,
  intensity: p.intensity
})), null, 2)}

Retorne APENAS array JSON de 3-5 IDs dos perfumes mais precisos.` }
        ];

        const recData = await callLovableAI(recommendationMessages, 0.3, 200);
        const recResponse = recData.choices[0].message.content.trim();
        
        console.log('Recommendation response:', recResponse);
        
        let parsedRecs = [];
        try {
          parsedRecs = JSON.parse(recResponse);
        } catch (parseError) {
          console.log('Failed to parse JSON, trying to extract IDs');
          const matches = recResponse.match(/"([^"]+)"/g);
          if (matches) {
            parsedRecs = matches.map((match: string) => match.replace(/"/g, ''));
          }
        }

        if (parsedRecs.length > 0) {
          recommendations = parsedRecs.slice(0, 5);
          isComplete = true;
          console.log('Successfully generated recommendations:', recommendations);
        } else {
          console.log('No recommendations parsed, using fallback');
        }
      } catch (error) {
        console.error('Error in direct recommendation generation:', error);
      }
      
      // If we couldn't generate recommendations, use fallback
      if (recommendations.length === 0) {
        console.log('Using fallback recommendations');
        const userProfile = conversationHistory.join('\n').toLowerCase();
        
        const mentionsFeminine = userProfile.includes('feminino') || userProfile.includes('mulher');
        const mentionsMasculine = userProfile.includes('masculino') || userProfile.includes('homem');
        const wantsWoody = userProfile.includes('amadeirado') || userProfile.includes('madeira');
        const wantsOriental = userProfile.includes('oriental') || userProfile.includes('âmbar');
        
        let filteredPerfumes = availablePerfumes;
        
        if (mentionsMasculine && !mentionsFeminine) {
          filteredPerfumes = availablePerfumes.filter(p => 
            p.gender === 'masculino' || p.gender === 'unissex'
          );
        } else if (mentionsFeminine && !mentionsMasculine) {
          filteredPerfumes = availablePerfumes.filter(p => 
            p.gender === 'feminino' || p.gender === 'unissex'
          );
        }
        
        if (wantsWoody) {
          filteredPerfumes = filteredPerfumes.filter(p => 
            p.family?.toLowerCase().includes('amadeirado') || 
            p.description?.toLowerCase().includes('madeira')
          );
        }
        
        if (wantsOriental) {
          filteredPerfumes = filteredPerfumes.filter(p => 
            p.family?.toLowerCase().includes('oriental')
          );
        }
        
        if (filteredPerfumes.length >= 3) {
          recommendations = filteredPerfumes.slice(0, 5).map(p => p.id);
          isComplete = true;
          console.log('Fallback recommendations:', recommendations);
        }
      }
      
      return new Response(JSON.stringify({
        content: "Análise concluída! Aqui estão suas recomendações personalizadas.",
        isComplete: true,
        recommendations
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (shouldRecommend && availablePerfumes.length > 0) {
      const hasTextRecommendations = aiResponse.includes('**') || 
                                    aiResponse.includes('1.') || 
                                    aiResponse.includes('2.');
      
      if (hasTextRecommendations) {
        console.log('Converting text recommendations to transition message');
        return new Response(JSON.stringify({
          content: "Perfeito! Com base em tudo que me contou, vou agora fazer uma análise completa das suas preferências e buscar as melhores opções no nosso catálogo. Isso levará apenas alguns instantes...",
          isComplete: false,
          needsRecommendations: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.toLowerCase().includes('vou agora fazer uma análise completa')) {
        console.log('Transition detected, generating recommendations');
        
        try {
          const userProfile = conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n');
          
          const recommendationMessages = [
            { role: 'system', content: `Você é um mestre perfumista analisando preferências para recomendar perfumes.

INSTRUÇÕES CRÍTICAS:
- Retorne APENAS um array JSON de IDs
- Formato: ["id1", "id2", "id3"]
- Recomende entre 3 a 5 perfumes que fazem SENTIDO PERFEITO para o perfil
- RESPEITE absolutamente gênero e preferências mencionadas
- NUNCA ignore famílias que o usuário disse não gostar` },
            { role: 'user', content: `PERFIL COMPLETO:
${userProfile}

CATÁLOGO:
${JSON.stringify(availablePerfumes.map(p => ({ 
  id: p.id, 
  name: p.name, 
  brand: p.brand, 
  family: p.family, 
  gender: p.gender,
  top_notes: p.top_notes,
  heart_notes: p.heart_notes,
  base_notes: p.base_notes,
  intensity: p.intensity
})), null, 2)}

Retorne APENAS array JSON de 3-5 IDs dos perfumes mais precisos.` }
          ];

          const recData = await callLovableAI(recommendationMessages, 0.3, 200);
          const recResponse = recData.choices[0].message.content.trim();
          
          let parsedRecs = [];
          try {
            parsedRecs = JSON.parse(recResponse);
          } catch (parseError) {
            const matches = recResponse.match(/"([^"]+)"/g);
            if (matches) {
              parsedRecs = matches.map((match: string) => match.replace(/"/g, ''));
            }
          }

          if (parsedRecs.length > 0) {
            recommendations = parsedRecs.slice(0, 5);
            isComplete = true;
          }
        } catch (error) {
          console.error('Error generating recommendations:', error);
          
          // Fallback based on conversation
          const userProfile = conversationHistory.join('\n').toLowerCase();
          
          const mentionsFeminine = userProfile.includes('feminino') || userProfile.includes('mulher');
          const mentionsMasculine = userProfile.includes('masculino') || userProfile.includes('homem');
          const wantsWoody = userProfile.includes('amadeirado') || userProfile.includes('madeira');
          const wantsOriental = userProfile.includes('oriental') || userProfile.includes('âmbar');
          
          let filteredPerfumes = availablePerfumes;
          
          if (mentionsMasculine && !mentionsFeminine) {
            filteredPerfumes = availablePerfumes.filter(p => 
              p.gender === 'masculino' || p.gender === 'unissex'
            );
          } else if (mentionsFeminine && !mentionsMasculine) {
            filteredPerfumes = availablePerfumes.filter(p => 
              p.gender === 'feminino' || p.gender === 'unissex'
            );
          }
          
          if (wantsWoody) {
            filteredPerfumes = filteredPerfumes.filter(p => 
              p.family?.toLowerCase().includes('amadeirado') || 
              p.description?.toLowerCase().includes('madeira')
            );
          }
          
          if (wantsOriental) {
            filteredPerfumes = filteredPerfumes.filter(p => 
              p.family?.toLowerCase().includes('oriental')
            );
          }
          
          if (filteredPerfumes.length >= 3) {
            recommendations = filteredPerfumes.slice(0, 5).map(p => p.id);
            isComplete = true;
          }
        }
      }
    }

    return new Response(JSON.stringify({
      content: aiResponse,
      isComplete,
      recommendations: recommendations.length > 0 ? recommendations : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in conversational-recommend:', error);
    
    const errorString = error instanceof Error ? error.message : String(error);
    let userMessage = 'Erro inesperado. Tente novamente.';
    let statusCode = 500;
    
    if (errorString.includes('RATE_LIMIT')) {
      userMessage = 'Muitas solicitações. Aguarde um momento e tente novamente.';
      statusCode = 429;
    } else if (errorString.includes('PAYMENT_REQUIRED')) {
      userMessage = 'Créditos insuficientes no Lovable AI. Adicione créditos em Settings → Workspace → Usage.';
      statusCode = 402;
    } else if (errorString.includes('indisponível')) {
      userMessage = 'Serviço de IA temporariamente indisponível. Tente novamente em alguns minutos.';
      statusCode = 503;
    }
    
    return new Response(JSON.stringify({ 
      error: userMessage 
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
