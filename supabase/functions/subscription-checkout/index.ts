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

    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY não configurada');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { plan_id } = await req.json();

    if (!plan_id) {
      throw new Error('plan_id é obrigatório');
    }

    console.log('🎯 Criando checkout de assinatura', { user_id: user.id, plan_id });

    // Buscar plano
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      throw new Error('Plano não encontrado ou inativo');
    }

    // Verificar se já tem assinatura ativa para este plano
    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_id', plan_id)
      .eq('status', 'active')
      .maybeSingle();

    if (existingSub) {
      throw new Error('Você já possui uma assinatura ativa para este plano');
    }

    // Buscar ou criar cliente Stripe
    let customerId: string;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Procurar cliente existente
    const existingCustomers = await stripe.customers.list({
      email: user.email!,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      // Criar novo cliente
      const customer = await stripe.customers.create({
        email: user.email!,
        name: profile?.name || user.email,
        metadata: {
          supabase_user_id: user.id
        }
      });
      customerId = customer.id;
    }

    // Criar ou obter Price no Stripe
    let priceId = plan.stripe_price_id;

    if (!priceId) {
      console.log('📝 Criando produto e preço no Stripe...');
      
      // Criar produto
      const product = await stripe.products.create({
        name: `Assinatura ${plan.name}`,
        description: plan.description || undefined,
        metadata: {
          plan_id: plan.id,
          decants_per_month: plan.decants_per_month.toString(),
          size_ml: plan.size_ml.toString()
        }
      });

      // Criar preço recorrente
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(plan.price_monthly * 100), // centavos
        currency: 'brl',
        recurring: {
          interval: 'month'
        }
      });

      priceId = price.id;

      // Salvar stripe_price_id no banco
      await supabase
        .from('subscription_plans')
        .update({ stripe_price_id: priceId })
        .eq('id', plan.id);
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          supabase_user_id: user.id,
          plan_id: plan.id
        }
      },
      success_url: `${req.headers.get('origin')}/minha-assinatura?success=true`,
      cancel_url: `${req.headers.get('origin')}/assinaturas?cancelled=true`,
      metadata: {
        supabase_user_id: user.id,
        plan_id: plan.id
      }
    });

    console.log('✅ Checkout criado:', session.id);

    return new Response(
      JSON.stringify({
        checkout_url: session.url,
        session_id: session.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Erro ao criar checkout:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
