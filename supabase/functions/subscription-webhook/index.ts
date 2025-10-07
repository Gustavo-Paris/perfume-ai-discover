import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY não configurada');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event: Stripe.Event;

    // Verificar assinatura do webhook se secret configurado
    if (stripeWebhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          stripeWebhookSecret
        );
      } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return new Response(
          JSON.stringify({ error: 'Webhook signature verification failed' }),
          { status: 400, headers: corsHeaders }
        );
      }
    } else {
      event = JSON.parse(body);
    }

    console.log('📨 Webhook recebido:', event.type);

    // Processar eventos de assinatura
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription') {
          const userId = session.metadata?.supabase_user_id;
          const planId = session.metadata?.plan_id;
          const subscriptionId = session.subscription as string;

          if (!userId || !planId) {
            console.error('❌ Metadados ausentes na sessão');
            break;
          }

          // Buscar detalhes da subscription no Stripe
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          // Criar assinatura no banco
          const { data: newSub, error: insertError } = await supabase
            .from('user_subscriptions')
            .insert({
              user_id: userId,
              plan_id: planId,
              status: 'active',
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: session.customer as string,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              trial_ends_at: subscription.trial_end 
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null
            })
            .select()
            .single();

          if (insertError) {
            console.error('❌ Erro ao criar assinatura:', insertError);
            break;
          }

          console.log('✅ Assinatura criada:', newSub.id);

          // Criar preferências padrão
          await supabase
            .from('subscription_preferences')
            .insert({
              subscription_id: newSub.id,
              surprise_me: true
            });

          // Registrar histórico
          await supabase.rpc('log_subscription_event', {
            p_subscription_id: newSub.id,
            p_event_type: 'created',
            p_event_data: {
              stripe_subscription_id: subscriptionId,
              plan_name: subscription.items.data[0]?.price?.product
            }
          });

          // TODO: Enviar email de boas-vindas
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: subscription.status === 'active' ? 'active' : 
                   subscription.status === 'past_due' ? 'past_due' :
                   subscription.status === 'canceled' ? 'cancelled' : 'paused',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          console.error('❌ Erro ao atualizar assinatura:', updateError);
        } else {
          console.log('✅ Assinatura atualizada:', subscription.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        const { error: cancelError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        if (cancelError) {
          console.error('❌ Erro ao cancelar assinatura:', cancelError);
        } else {
          console.log('✅ Assinatura cancelada:', subscription.id);
          
          // Registrar no histórico
          const { data: sub } = await supabase
            .from('user_subscriptions')
            .select('id')
            .eq('stripe_subscription_id', subscription.id)
            .single();

          if (sub) {
            await supabase.rpc('log_subscription_event', {
              p_subscription_id: sub.id,
              p_event_type: 'cancelled',
              p_event_data: {
                cancelled_at: new Date().toISOString()
              }
            });
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          console.log('✅ Pagamento bem-sucedido para subscription:', invoice.subscription);
          
          // Registrar pagamento no histórico
          const { data: sub } = await supabase
            .from('user_subscriptions')
            .select('id')
            .eq('stripe_subscription_id', invoice.subscription)
            .single();

          if (sub) {
            await supabase.rpc('log_subscription_event', {
              p_subscription_id: sub.id,
              p_event_type: 'payment_succeeded',
              p_event_data: {
                amount: invoice.amount_paid / 100,
                invoice_id: invoice.id
              }
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          // Marcar como past_due
          await supabase
            .from('user_subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription);

          console.log('⚠️ Pagamento falhou para subscription:', invoice.subscription);

          // Registrar falha no histórico
          const { data: sub } = await supabase
            .from('user_subscriptions')
            .select('id, user_id')
            .eq('stripe_subscription_id', invoice.subscription)
            .single();

          if (sub) {
            await supabase.rpc('log_subscription_event', {
              p_subscription_id: sub.id,
              p_event_type: 'payment_failed',
              p_event_data: {
                amount: invoice.amount_due / 100,
                invoice_id: invoice.id
              }
            });

            // TODO: Enviar email de falha de pagamento
          }
        }
        break;
      }

      default:
        console.log('ℹ️ Evento não processado:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
