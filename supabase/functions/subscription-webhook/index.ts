import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";

serve(async (req) => {
  const logger = createLogger('subscription-webhook');

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

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
        logger.error('Webhook signature verification failed', { error: err.message });
        return new Response(
          JSON.stringify({ error: 'Webhook signature verification failed' }),
          { status: 400, headers: corsHeaders }
        );
      }
    } else {
      event = JSON.parse(body);
    }

    logger.important('Webhook received', { type: event.type });

    // Processar eventos de assinatura
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription') {
          const userId = session.metadata?.supabase_user_id;
          const planId = session.metadata?.plan_id;
          const subscriptionId = session.subscription as string;

          if (!userId || !planId) {
            logger.error('Missing metadata in session', { hasUserId: !!userId, hasPlanId: !!planId });
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
            logger.error('Failed to create subscription', { error: insertError.message });
            break;
          }

          logger.success('Subscription created', { subscriptionId: newSub.id });

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

          // Enviar email de boas-vindas
          try {
            // Buscar dados do usuário
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('email, name')
              .eq('id', userId)
              .single();

            // Buscar dados do plano
            const { data: plan } = await supabase
              .from('subscription_plans')
              .select('name, price')
              .eq('id', planId)
              .single();

            if (userProfile?.email) {
              await supabase.functions.invoke('send-email', {
                body: {
                  to: userProfile.email,
                  template: 'subscription_welcome',
                  data: {
                    customerName: userProfile.name || 'Cliente',
                    planName: plan?.name || 'Clube de Curadoria',
                    planPrice: plan?.price?.toFixed(2) || '0.00',
                    nextShipmentDate: new Date(subscription.current_period_end * 1000).toLocaleDateString('pt-BR'),
                    dashboardUrl: 'https://perfume-ai-discover.vercel.app/assinaturas'
                  }
                }
              });
              logger.debug('Welcome email sent', { email: userProfile.email });
            }
          } catch (emailError) {
            logger.warn('Failed to send welcome email', { error: emailError instanceof Error ? emailError.message : String(emailError) });
          }
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
          logger.error('Failed to update subscription', { error: updateError.message, stripeId: subscription.id });
        } else {
          logger.debug('Subscription updated', { stripeId: subscription.id, status: subscription.status });
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
          logger.error('Failed to cancel subscription', { error: cancelError.message, stripeId: subscription.id });
        } else {
          logger.debug('Subscription cancelled', { stripeId: subscription.id });
          
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
          logger.debug('Payment succeeded', { stripeSubscriptionId: invoice.subscription, amount: invoice.amount_paid / 100 });
          
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

          logger.warn('Payment failed', { stripeSubscriptionId: invoice.subscription, amount: invoice.amount_due / 100 });

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

            // Enviar email de falha de pagamento
            try {
              const { data: userProfile } = await supabase
                .from('profiles')
                .select('email, name')
                .eq('id', sub.user_id)
                .single();

              if (userProfile?.email) {
                // Calcular data limite (7 dias de graça)
                const gracePeriodEnd = new Date();
                gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

                await supabase.functions.invoke('send-email', {
                  body: {
                    to: userProfile.email,
                    template: 'subscription_payment_failed',
                    data: {
                      customerName: userProfile.name || 'Cliente',
                      amount: (invoice.amount_due / 100).toFixed(2),
                      attemptDate: new Date().toLocaleDateString('pt-BR'),
                      failureReason: 'Pagamento recusado pelo banco emissor',
                      updatePaymentUrl: 'https://perfume-ai-discover.vercel.app/assinaturas',
                      gracePeriodEnd: gracePeriodEnd.toLocaleDateString('pt-BR')
                    }
                  }
                });
                logger.debug('Payment failed email sent', { email: userProfile.email });
              }
            } catch (emailError) {
              logger.warn('Failed to send payment failed email', { error: emailError instanceof Error ? emailError.message : String(emailError) });
            }
          }
        }
        break;
      }

      default:
        logger.debug('Event not processed', { type: event.type });
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    logger.failure('Failed to process webhook', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
