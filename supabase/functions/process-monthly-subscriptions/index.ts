import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Ler parâmetros do corpo da requisição
    const { forceRun = false, dryRun = false } = await req.json().catch(() => ({}));

    console.log('🚀 Iniciando processamento mensal de assinaturas...');
    console.log(`⚙️ Modo: ${dryRun ? 'SIMULAÇÃO' : 'REAL'} | Forçado: ${forceRun ? 'SIM' : 'NÃO'}`);

    // Buscar assinaturas ativas
    const { data: activeSubscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*),
        preferences:subscription_preferences(*)
      `)
      .eq('status', 'active');

    if (subError) {
      throw new Error(`Erro ao buscar assinaturas: ${subError.message}`);
    }

    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      console.log('ℹ️ Nenhuma assinatura ativa encontrada');
      return new Response(
        JSON.stringify({ processed: 0, message: 'Nenhuma assinatura para processar' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`📋 ${activeSubscriptions.length} assinaturas ativas encontradas`);

    const results = {
      success: true,
      processed: 0,
      skipped: 0,
      failed: 0,
      errors: [] as Array<{ subscriptionId: string; error: string }>,
      details: [] as Array<{ subscriptionId: string; status: 'success' | 'error'; message: string }>
    };

    // Data do mês atual (primeiro dia)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    const monthYear = currentMonth.toISOString().split('T')[0];

    for (const subscription of activeSubscriptions) {
      try {
        console.log(`\n🔄 Processando assinatura ${subscription.id}...`);

        // Verificar se já foi processado este mês (pular se não for forceRun)
        if (!forceRun) {
          const { data: existingShipment } = await supabase
            .from('subscription_shipments')
            .select('id')
            .eq('subscription_id', subscription.id)
            .eq('month_year', monthYear)
            .maybeSingle();

          if (existingShipment) {
            console.log('⏭️ Já processado este mês, pulando...');
            results.skipped++;
            results.details.push({
              subscriptionId: subscription.id,
              status: 'success',
              message: 'Já processado este mês'
            });
            continue;
          }
        }

        const plan = subscription.plan;
        if (!plan) {
          throw new Error('Plano não encontrado');
        }

        // Buscar perfumes disponíveis
        const { data: perfumes } = await supabase
          .from('perfumes')
          .select('*')
          .gte('total_stock_ml', plan.size_ml);

        if (!perfumes || perfumes.length === 0) {
          throw new Error('Nenhum perfume disponível em estoque');
        }

        // Buscar envios anteriores (últimos 6 meses)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const { data: previousShipments } = await supabase
          .from('subscription_shipments')
          .select('perfume_ids')
          .eq('subscription_id', subscription.id)
          .gte('month_year', sixMonthsAgo.toISOString().split('T')[0]);

        const previousPerfumeIds = previousShipments?.flatMap(s => s.perfume_ids) || [];

        // Selecionar perfumes (lógica simplificada aqui - pode usar função externa)
        const preferences = subscription.preferences?.[0] || {
          preferred_families: [],
          preferred_gender: [],
          excluded_notes: [],
          intensity_preference: 'any',
          surprise_me: true
        };

        // Filtrar candidatos
        let candidates = perfumes.filter(p => !previousPerfumeIds.includes(p.id));

        // Aplicar preferências básicas
        if (preferences.preferred_families?.length > 0) {
          const filtered = candidates.filter(p => 
            preferences.preferred_families.includes(p.family)
          );
          if (filtered.length >= plan.decants_per_month) {
            candidates = filtered;
          }
        }

        // Selecionar quantidade necessária
        const selectedPerfumes = candidates
          .sort(() => Math.random() - 0.5) // Shuffle
          .slice(0, plan.decants_per_month);

        if (selectedPerfumes.length < plan.decants_per_month) {
          throw new Error(`Perfumes insuficientes: ${selectedPerfumes.length}/${plan.decants_per_month}`);
        }

        const selectedIds = selectedPerfumes.map(p => p.id);
        const perfumeNames = selectedPerfumes.map(p => `${p.brand} - ${p.name}`).join(', ');

        if (!dryRun) {
          // Criar envio
          const { data: shipment, error: shipmentError } = await supabase
            .from('subscription_shipments')
            .insert({
              subscription_id: subscription.id,
              month_year: monthYear,
              perfume_ids: selectedIds,
              status: 'pending',
              selection_reasoning: {
                selection_date: new Date().toISOString(),
                perfumes: selectedPerfumes.map(p => ({
                  id: p.id,
                  name: p.name,
                  brand: p.brand,
                  family: p.family
                }))
              }
            })
            .select()
            .single();

          if (shipmentError) {
            throw shipmentError;
          }

          console.log('✅ Envio criado:', shipment.id);

          // Consumir estoque
          for (const perfume of selectedPerfumes) {
            const { error: stockError } = await supabase.rpc('consume_perfume_stock', {
              p_perfume_id: perfume.id,
              p_quantity_ml: plan.size_ml
            });

            if (stockError) {
              console.error(`⚠️ Erro ao consumir estoque de ${perfume.name}:`, stockError);
            }
          }

          // Registrar no histórico
          await supabase.rpc('log_subscription_event', {
            p_subscription_id: subscription.id,
            p_event_type: 'shipment_created',
            p_event_data: {
              shipment_id: shipment.id,
              perfume_count: selectedIds.length,
              month_year: monthYear
            }
          });

          console.log('✅ Assinatura processada com sucesso!');
        } else {
          console.log('🔍 SIMULAÇÃO: Envio não criado');
        }

        results.processed++;
        results.details.push({
          subscriptionId: subscription.id,
          status: 'success',
          message: `${dryRun ? '[SIMULAÇÃO] ' : ''}Selecionados: ${perfumeNames}`
        });

      } catch (error) {
        console.error(`❌ Erro ao processar assinatura ${subscription.id}:`, error);
        results.failed++;
        results.errors.push({
          subscriptionId: subscription.id,
          error: error.message
        });
        results.details.push({
          subscriptionId: subscription.id,
          status: 'error',
          message: error.message
        });
      }
    }

    console.log('\n📊 Resumo do processamento:', results);

    return new Response(
      JSON.stringify(results),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Erro fatal no processamento:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
