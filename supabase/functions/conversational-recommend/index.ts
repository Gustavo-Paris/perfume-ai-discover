
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`Attempt ${attempt + 1} failed:`, errorMessage);
      
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
    const systemPrompt = `Você é um especialista mundial em perfumaria com décadas de experiência, conhecido por fazer curadorias perfeitas que impressionam os clientes.

SEU OBJETIVO: Descobrir profundamente as preferências do cliente através de uma conversa envolvente e recomendar entre 1 a 5 perfumes PERFEITOS baseados nas suas necessidades específicas.

ESTILO DE CONVERSA:
- Seja caloroso, acolhedor e genuinamente interessado nas preferências
- Faça perguntas que fluem naturalmente da resposta anterior
- Use linguagem brasileira informal mas sofisticada
- Seja um consultor experiente e perspicaz, não um robô

PROCESSO DE DESCOBERTA INTELIGENTE:
1. INÍCIO: Cumprimente e pergunte sobre a busca (para si ou presente)
2. MAPEAMENTO PROFUNDO (PERGUNTAS ESSENCIAIS):
   - Gênero da pessoa que vai usar (masculino/feminino/unissex)
   - Faixa etária e personalidade (jovem, adulto, maduro, estilo)
   - Ocasiões de uso (trabalho, festa, dia a dia, especiais, estações)
   - Preferências de intensidade (suave, moderado, marcante, projeção)
   - Famílias olfativas preferidas E NÃO GOSTADAS (crucial!)
   - **CRÍTICO**: Pergunte sobre perfumes que já provou, gostou ou não gostou
   - **CRUCIAL**: Se mencionar perfumes específicos, explore PROFUNDAMENTE o QUE gostou neles
   - Orçamento aproximado (se relevante para escolhas)
   - Personalidade, estilo de vida, profissão se relevante
3. ANÁLISE INTELIGENTE: Quando tiver informações SUFICIENTES para fazer recomendações precisas, diga EXATAMENTE: "Perfeito! Com base em tudo que me contou, vou agora fazer uma análise completa das suas preferências e buscar as melhores opções no nosso catálogo. Isso levará apenas alguns instantes..." e PARE.

EXPERTISE EM PERFUMARIA:
- Conheça famílias olfativas, notas, DNA olfativo de perfumes famosos
- Identifique inspirações, clones, versões similares entre marcas
- Entenda progressão olfativa (saída, coração, fundo)
- Reconheça características de diferentes casas perfumísticas
- Saiba combinar preferências pessoais com perfis olfativos

REGRAS CRÍTICAS:
- NUNCA liste perfumes ou recomendações no texto da conversa
- NUNCA pergunte sobre orçamento diretamente - descubra indiretamente através do contexto
- NUNCA finalize sem ter informações ESSENCIAIS para recomendações precisas
- Se o usuário mencionar perfumes específicos, EXPLORE profundamente o que gostou
- Se mencionar não gostar de algo, entenda EXATAMENTE o que incomoda
- ADAPTE suas perguntas baseado nas respostas anteriores
- Seja GENUINAMENTE curioso sobre as preferências olfativas

APÓS AS RECOMENDAÇÕES:
- O cliente pode continuar se não gostar das sugestões
- Pergunte especificamente o que não agradou
- Explore aspectos que podem ter passado despercebidos
- Use feedback para refinar ainda mais o perfil
- Demonstre conhecimento profundo sobre alternativas

${availablePerfumes.length > 0 ? `CATÁLOGO DISPONÍVEL COM DETALHES COMPLETOS:
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
  category: p.category,
  intensity: p.intensity,
  longevity: p.longevity,
  sillage: p.sillage,
  price_5ml: p.price_5ml,
  price_10ml: p.price_10ml
})), null, 2)}` : 'CATÁLOGO: Temporariamente indisponível, mas posso ajudar com recomendações gerais.'}

INTELIGÊNCIA AVANÇADA:
- Analise o perfil completo antes de recomendar
- Considere compatibilidade entre notas, intensidade, ocasiões
- Identifique padrões nas preferências mencionadas
- Reconheça inspirações e similaridades entre perfumes
- Priorize QUALIDADE e PRECISÃO sobre quantidade
- Se o perfil for muito específico, recomende apenas 1-2 perfumes perfeitos
- Se houver múltiplas preferências válidas, ofereça até 5 opções bem justificadas

REGRAS FINAIS:
- NUNCA mencione ser uma IA
- Uma pergunta por vez, bem contextualizada
- Demonstre expertise real em perfumaria
- Faça recomendações que IMPRESSIONEM pela precisão`;

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

    // Check if AI wants to make recommendations - more comprehensive detection
    const shouldRecommend = aiResponse.toLowerCase().includes('vou agora fazer uma análise completa') || 
                           aiResponse.toLowerCase().includes('deixe-me analisar') || 
                           aiResponse.toLowerCase().includes('analisar suas preferências') ||
                           aiResponse.toLowerCase().includes('encontrar os perfumes ideais') ||
                           aiResponse.toLowerCase().includes('buscar as melhores opções') ||
                           aiResponse.toLowerCase().includes('vou recomendar') ||
                           aiResponse.toLowerCase().includes('aqui estão') ||
                           aiResponse.toLowerCase().includes('sugestões que') ||
                           aiResponse.toLowerCase().includes('**') || // Detects markdown formatting for perfume names
                           (conversationHistory.length >= 10 && !isContinuation);

    let recommendations: string[] = [];
    let isComplete = false;

    // If AI is making recommendations in text format, convert to transition message
    if (shouldRecommend && availablePerfumes.length > 0) {
      // If AI already generated recommendations in text, send transition instead
      const hasTextRecommendations = aiResponse.includes('**') || 
                                    aiResponse.includes('1.') || 
                                    aiResponse.includes('2.') || 
                                    aiResponse.includes('3.');
      
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
      
      // If it's just a transition message, proceed to generate recommendations
      if (aiResponse.toLowerCase().includes('vou agora fazer uma análise completa') ||
          aiResponse.toLowerCase().includes('deixe-me analisar') || 
          aiResponse.toLowerCase().includes('analisar suas preferências') ||
          aiResponse.toLowerCase().includes('buscar as melhores opções')) {
        console.log('Transition message detected, generating recommendations immediately');
        
        // Generate recommendations using AI
        try {
          const userProfile = conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n');
          
          const recommendationMessages = [
            { role: 'system', content: `Você é um mestre perfumista com conhecimento enciclopédico sobre fragrâncias. Sua expertise inclui:

CONHECIMENTO AVANÇADO:
- DNA olfativo de perfumes clássicos e modernos
- Inspirações, clones, versões similares entre marcas
- Progressão olfativa (saída, coração, fundo) 
- Características de diferentes casas perfumísticas
- Compatibilidade entre notas e famílias olfativas
- Perfumes que "lembram" ou são similares a outros

ANÁLISE INTELIGENTE:
- Identifique PADRÕES nas preferências do usuário
- Se mencionar perfumes específicos, encontre similares ou inspirações
- Considere personalidade, idade, ocasiões, intensidade desejada
- Analise o que o usuário GOSTA vs. o que NÃO GOSTA
- Priorize QUALIDADE da combinação sobre quantidade

INSTRUÇÕES CRÍTICAS OBRIGATÓRIAS:
- Analise profundamente o perfil completo do usuário
- Se mencionar gostar de um perfume específico, procure similares/inspirações
- Considere notas, família, intensidade, ocasiões mencionadas
- **REGRA ABSOLUTA**: RESPEITE RIGOROSAMENTE as preferências de gênero
- **NUNCA** recomende perfumes femininos se usuário quer masculino/unissex
- **NUNCA** ignore famílias olfativas que o usuário NÃO GOSTA
- **NUNCA** recomende florais se usuário especificamente não gosta
- Verifique DUAS VEZES o gender do perfume antes de recomendar
- Recomende apenas perfumes que fazem SENTIDO PERFEITO para o perfil
- Responda APENAS com JSON array de IDs: ["id1", "id2", "id3"]` },
            { role: 'user', content: `PERFIL COMPLETO DO USUÁRIO:
${userProfile}

ANÁLISE REQUERIDA:
1. Extraia TODAS as preferências mencionadas (gênero, famílias, intensidade, ocasiões)
2. Identifique perfumes específicos mencionados como referência
3. Note o que o usuário NÃO GOSTA (elimine essas opções)
4. Considere personalidade, idade, estilo de vida mencionados
5. Busque perfumes que "casem" perfeitamente com o perfil

CATÁLOGO COMPLETO COM DETALHES:
${JSON.stringify(availablePerfumes.map(p => ({ 
  id: p.id, 
  name: p.name, 
  brand: p.brand, 
  description: p.description, 
  family: p.family, 
  gender: p.gender,
  top_notes: p.top_notes,
  heart_notes: p.heart_notes,
  base_notes: p.base_notes,
  category: p.category,
  intensity: p.intensity,
  longevity: p.longevity,
  sillage: p.sillage
})), null, 2)}

RESPOSTA: Analise o perfil e retorne APENAS um JSON array com 1-5 IDs dos perfumes mais PRECISOS e COERENTES. Priorize QUALIDADE absoluta da recomendação.` }
          ];

          const recommendationData = await callOpenAI(recommendationMessages);
          const recommendationResponse = recommendationData.choices[0].message.content.trim();
          
          // Parse recommendations
          let parsedRecommendations = [];
          try {
            parsedRecommendations = JSON.parse(recommendationResponse);
          } catch (parseError) {
            // If parsing fails, try to extract IDs from text
            const matches = recommendationResponse.match(/"([^"]+)"/g);
            if (matches) {
              parsedRecommendations = matches.map((match: string) => match.replace(/"/g, ''));
            }
          }

          if (parsedRecommendations.length > 0) {
            recommendations = parsedRecommendations.slice(0, 5); // Allow up to 5 recommendations
            isComplete = true;
          }
        } catch (error) {
          console.error('Error generating recommendations:', error);
          // Fallback to smart recommendations based on conversation
          const userProfile = conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n').toLowerCase();
          
          // Enhanced preference detection with strict gender filtering
          const mentionsFeminine = userProfile.includes('feminino') || 
                                  userProfile.includes('feminina') || 
                                  userProfile.includes('mulher');
          const mentionsMasculine = userProfile.includes('masculino') || 
                                   userProfile.includes('homem') || 
                                   (userProfile.includes('para mim') && !mentionsFeminine);
          const wantsUnisex = userProfile.includes('unissex');
          const wantsWoody = userProfile.includes('amadeirado') || 
                            userProfile.includes('madeira') || 
                            userProfile.includes('woody');
          const wantsOriental = userProfile.includes('oriental') || 
                               userProfile.includes('âmbar');
          
          let filteredPerfumes = availablePerfumes;
          
          // Apply STRICT gender filter - NEVER include feminino if user wants masculino/unissex
          if (mentionsMasculine && !mentionsFeminine) {
            filteredPerfumes = availablePerfumes.filter(p => 
              p.gender === 'masculino' || p.gender === 'unissex'
            );
            console.log(`Filtered to ${filteredPerfumes.length} masculine/unisex perfumes (original: ${availablePerfumes.length})`);
          } else if (mentionsFeminine && !mentionsMasculine) {
            filteredPerfumes = availablePerfumes.filter(p => 
              p.gender === 'feminino' || p.gender === 'unissex'
            );
          } else if (wantsUnisex) {
            filteredPerfumes = availablePerfumes.filter(p => p.gender === 'unissex');
          }
          
          // Apply family filter
          if (wantsWoody) {
            const woodyPerfumes = filteredPerfumes.filter(p => 
              p.family?.toLowerCase().includes('amadeirado') || 
              p.family?.toLowerCase().includes('woody') ||
              p.description?.toLowerCase().includes('amadeirado')
            );
            if (woodyPerfumes.length > 0) {
              filteredPerfumes = woodyPerfumes;
            }
          }
          
          // Remove floral perfumes for masculine preferences or if user dislikes floral
          if (mentionsMasculine || userProfile.includes('não gosto') && userProfile.includes('floral')) {
            const nonFloralPerfumes = filteredPerfumes.filter(p => 
              !p.family?.toLowerCase().includes('floral') &&
              !p.description?.toLowerCase().includes('floral')
            );
            if (nonFloralPerfumes.length > 0) {
              filteredPerfumes = nonFloralPerfumes;
            }
          }
          
          recommendations = filteredPerfumes
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(3, filteredPerfumes.length))
            .map(p => p.id);
          isComplete = true;
        }

        return new Response(JSON.stringify({
          content: aiResponse,
          isComplete: true,
          recommendations: recommendations
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Check if this is a follow-up request for actual recommendations
    const isRecommendationRequest = message === 'gerar recomendações' || 
                                   conversationHistory.some((msg: any) => 
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
        // Generate recommendations based on conversation with advanced intelligence
        const recommendationPrompt = `Você é um mestre perfumista com décadas de experiência, conhecido mundialmente pela precisão das suas recomendações.

MISSÃO: Analisar profundamente esta conversa e escolher entre 1 a 5 perfumes que mais PRECISAMENTE combinam com o cliente.

ANÁLISE COMPLETA DA CONVERSA:
${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}
${!isContinuation ? `Última mensagem: ${message}` : ''}

EXPERTISE AVANÇADA:
- Identifique PADRÕES e PREFERÊNCIAS específicas mencionadas
- Reconheça perfumes de referência mencionados e encontre similares
- Analise personalidade, estilo de vida, ocasiões de uso
- Considere idade, gênero, faixa etária mencionada
- Note o que o cliente GOSTA vs. o que NÃO GOSTA
- Identifique inspirações, clones, versões similares
- Considere compatibilidade entre notas e famílias

CATÁLOGO COMPLETO COM ANÁLISE DETALHADA:
${JSON.stringify(availablePerfumes.map(p => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  family: p.family,
  gender: p.gender,
  description: p.description,
  top_notes: p.top_notes,
  heart_notes: p.heart_notes,
  base_notes: p.base_notes,
  category: p.category,
  intensity: p.intensity,
  longevity: p.longevity,
  sillage: p.sillage,
  price_5ml: p.price_5ml,
  price_10ml: p.price_10ml
})), null, 2)}

CRITÉRIOS DE SELEÇÃO INTELIGENTE:
✓ MÁXIMA PRECISÃO baseada no perfil completo revelado
✓ Considere TODAS as preferências e aversões mencionadas
✓ Se mencionar perfumes específicos, encontre similares ou inspirações
✓ Analise compatibilidade: notas + família + intensidade + ocasiões
✓ Considere personalidade e estilo de vida mencionados
✓ PRIORIZE QUALIDADE ABSOLUTA sobre quantidade
✓ Se perfil muito específico: 1-2 perfumes PERFEITOS
✓ Se múltiplas preferências válidas: até 5 opções EXCEPCIONAIS
✓ Ordene do mais adequado para o menos adequado
✓ NUNCA ignore preferências explícitas do cliente

INTELIGÊNCIA COMPARATIVA:
- Se cliente gosta de "Baccarat Rouge", procure orientais gourmands similares
- Se gosta de "Sauvage", procure frescas amadeiradas masculinas
- Se menciona "elegante", priorize sofisticados e atemporais
- Se menciona "jovem", considere modernos e dinâmicos
- Se fala em "trabalho", priorize discretos e profissionais

RESPOSTA FINAL: Retorne APENAS um array JSON de 1-5 IDs dos perfumes mais INTELIGENTEMENTE selecionados.
Exemplo: ["id1"] ou ["id1", "id2", "id3"]

LEMBRE-SE: Esta recomendação deve IMPRESSIONAR o cliente pela precisão e inteligência da seleção!`;

        const recData = await callOpenAI([
          { role: 'system', content: 'Você é um mestre perfumista que faz recomendações com PRECISÃO ABSOLUTA baseado em conversas detalhadas. Analise o perfil completo e responda APENAS com arrays JSON de IDs. Sua reputação depende da QUALIDADE das recomendações.' },
          { role: 'user', content: recommendationPrompt }
        ], 0.1, 200);
        
        const recContent = recData.choices[0].message.content.trim();
        
        try {
          const parsedRecs = JSON.parse(recContent);
          if (Array.isArray(parsedRecs)) {
            recommendations = parsedRecs.slice(0, 5); // Allow up to 5 recommendations
            isComplete = true;
            console.log('Recommendations generated:', recommendations);
          }
        } catch (e) {
          console.log('Failed to parse recommendations, using intelligent fallback');
          
          // Intelligent fallback based on comprehensive conversation analysis
          const userProfile = conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n').toLowerCase();
          
          // Advanced preference detection with semantic analysis
          const preferences = {
            // Gender preferences
            masculine: userProfile.match(/\b(masculino|homem|para mim|pra mim|pra ele|para ele)\b/g) && !userProfile.includes('feminino'),
            feminine: userProfile.match(/\b(feminino|mulher|para ela|pra ela|feminina)\b/g),
            unisex: userProfile.includes('unissex') || userProfile.includes('tanto faz'),
            
            // Family preferences - expanded analysis
            woody: userProfile.match(/\b(amadeirado|madeira|woody|sândalo|cedro|oud|agarwood)\b/g),
            oriental: userProfile.match(/\b(oriental|âmbar|amber|baunilha|especiado|incenso)\b/g),
            fresh: userProfile.match(/\b(fresco|fresh|cítrico|bergamota|limão|lavanda|aquático)\b/g),
            floral: userProfile.match(/\b(floral|flores|rosa|jasmim|peônia|lírio)\b/g),
            gourmand: userProfile.match(/\b(gourmand|doce|chocolate|caramelo|café|mel)\b/g),
            
            // Intensity preferences
            subtle: userProfile.match(/\b(suave|sutil|discreto|leve|delicado)\b/g),
            moderate: userProfile.match(/\b(moderado|médio|equilibrado|na medida)\b/g),
            strong: userProfile.match(/\b(marcante|forte|intenso|poderoso|projection)\b/g),
            
            // Occasion preferences
            daily: userProfile.match(/\b(dia a dia|trabalho|escritório|diário|cotidiano)\b/g),
            evening: userProfile.match(/\b(noite|festa|balada|jantar|evento)\b/g),
            formal: userProfile.match(/\b(formal|elegante|sofisticado|executivo)\b/g),
            casual: userProfile.match(/\b(casual|relaxado|descontraído|fim de semana)\b/g),
            
            // Age/style preferences
            young: userProfile.match(/\b(jovem|moderno|atual|trendy|youth)\b/g),
            mature: userProfile.match(/\b(maduro|clássico|tradicional|atemporal)\b/g),
            
            // Negative preferences - what they DON'T want
            dislikes: {
              floral: userProfile.match(/\b(não gosto.*floral|detesto.*floral|odeio.*floral|não curto.*floral)\b/g),
              sweet: userProfile.match(/\b(não gosto.*doce|muito doce|enjoativo|sicativo)\b/g),
              strong: userProfile.match(/\b(não gosto.*forte|muito forte|exagerado|pesado demais)\b/g),
              synthetic: userProfile.match(/\b(sintético|artificial|químico|ruim)\b/g)
            }
          };
          
          console.log('Intelligent preference analysis:', preferences);
          
          // Smart filtering based on comprehensive analysis
          let filteredPerfumes = [...availablePerfumes];
          
          // Apply STRICT gender filtering - NEVER mix genders if user specified
          if (preferences.masculine && !preferences.feminine) {
            const originalCount = filteredPerfumes.length;
            filteredPerfumes = filteredPerfumes.filter(p => 
              p.gender === 'masculino' || p.gender === 'unissex'
            );
            console.log(`STRICT GENDER FILTER: ${originalCount} -> ${filteredPerfumes.length} (removed all feminine)`);
          } else if (preferences.feminine && !preferences.masculine) {
            filteredPerfumes = filteredPerfumes.filter(p => 
              p.gender === 'feminino' || p.gender === 'unissex'
            );
          } else if (preferences.unisex) {
            filteredPerfumes = filteredPerfumes.filter(p => p.gender === 'unissex');
          }
          
          // DOUBLE CHECK: Remove any feminine perfumes if user wants masculine/unisex only
          if (preferences.masculine && !preferences.feminine) {
            filteredPerfumes = filteredPerfumes.filter(p => p.gender !== 'feminino');
            console.log(`DOUBLE CHECK: Ensured no feminine perfumes in final list`);
          }
          
          // Apply family preferences with intelligent scoring
          let scoredPerfumes = filteredPerfumes.map(perfume => {
            let score = 0;
            const perfumeData = (perfume.family?.toLowerCase() + ' ' + 
                               perfume.description?.toLowerCase() + ' ' +
                               (perfume.top_notes?.join(' ') || '') + ' ' +
                               (perfume.heart_notes?.join(' ') || '') + ' ' +
                               (perfume.base_notes?.join(' ') || '')).toLowerCase();
            
            // Score based on family preferences
            if (preferences.woody && perfumeData.match(/\b(amadeirado|woody|sândalo|cedro|oud|madeira)\b/)) score += 3;
            if (preferences.oriental && perfumeData.match(/\b(oriental|âmbar|amber|especiado|baunilha)\b/)) score += 3;
            if (preferences.fresh && perfumeData.match(/\b(fresco|fresh|cítrico|aquático|lavanda)\b/)) score += 3;
            if (preferences.floral && perfumeData.match(/\b(floral|rosa|jasmim|peônia)\b/) && !preferences.dislikes.floral) score += 3;
            if (preferences.gourmand && perfumeData.match(/\b(gourmand|doce|chocolate|caramelo|baunilha)\b/)) score += 3;
            
            // Score based on intensity preferences
            if (preferences.subtle && (perfume.intensity === 'light' || perfume.sillage === 'intimate')) score += 2;
            if (preferences.strong && (perfume.intensity === 'strong' || perfume.sillage === 'enormous')) score += 2;
            
            // Negative scoring for dislikes
            if (preferences.dislikes.floral && perfumeData.includes('floral')) score -= 5;
            if (preferences.dislikes.sweet && perfumeData.match(/\b(doce|sweet|gourmand)\b/)) score -= 3;
            
            // Bonus for specific brand/style preferences
            if (preferences.young && (perfume.category === 'designer' || perfume.brand?.match(/\b(versace|dolce|one million|invictus)\b/i))) score += 1;
            if (preferences.mature && (perfume.category === 'niche' || perfume.brand?.match(/\b(tom ford|creed|maison)\b/i))) score += 1;
            
            return { ...perfume, score };
          });
          
          // Sort by score and take top recommendations
          const topPerfumes = scoredPerfumes
            .sort((a, b) => b.score - a.score)
            .filter(p => p.score > 0) // Only include perfumes with positive scores
            .slice(0, 5);
          
          console.log('Intelligent fallback scoring results:', topPerfumes.map(p => ({ name: p.name, brand: p.brand, score: p.score })));
          
          if (topPerfumes.length > 0) {
            recommendations = topPerfumes.map(p => p.id);
          } else {
            // Final fallback with STRICT gender filtering
            const basicFiltered = availablePerfumes.filter(p => {
              if (preferences.masculine && !preferences.feminine) {
                // NEVER include feminine if user wants masculine
                return p.gender === 'masculino' || p.gender === 'unissex';
              }
              if (preferences.feminine && !preferences.masculine) {
                return p.gender === 'feminino' || p.gender === 'unissex';
              }
              return true;
            });
            console.log(`FINAL FALLBACK: ${basicFiltered.length} perfumes after strict gender filter`);
            recommendations = basicFiltered.slice(0, 3).map(p => p.id);
          }
          
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
    const errorString = error instanceof Error ? error.message : String(error);
    
    if (errorString.includes('Rate limit exceeded')) {
      errorMessage = 'Muitas solicitações. Aguarde um momento e tente novamente.';
      statusCode = 429;
    } else if (errorString.includes('Invalid API key')) {
      errorMessage = 'Configuração da IA inválida. Entre em contato com o suporte.';
      statusCode = 401;
    } else if (errorString.includes('service temporarily unavailable')) {
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
