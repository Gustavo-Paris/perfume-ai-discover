import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutItem {
  perfume_id: string;
  name: string;
  brand: string;
  size_ml: number;
  quantity: number;
  unit_price: number;
}

interface CheckoutRequest {
  items: CheckoutItem[];
  user_email?: string;
}

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] [STRIPE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Stripe checkout function started");

    // Check for Stripe secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      logStep("ERROR: STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Stripe não configurado. Configure a chave secreta no admin.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    let user = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data } = await supabase.auth.getUser(token);
      user = data.user;
      logStep("User authenticated", { userId: user?.id, email: user?.email });
    } else {
      logStep("No authentication - guest checkout");
    }

    // Parse request body
    const { items, user_email }: CheckoutRequest = await req.json();
    logStep("Checkout request parsed", { itemCount: items.length });

    if (!items || items.length === 0) {
      throw new Error('Nenhum item no carrinho');
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });
    logStep("Stripe initialized");

    // Determine customer email
    const customerEmail = user?.email || user_email || 'guest@perfumesparis.com';
    logStep("Customer email determined", { email: customerEmail });

    // Check if Stripe customer exists
    let customerId: string | undefined;
    if (customerEmail !== 'guest@perfumesparis.com') {
      const customers = await stripe.customers.list({ 
        email: customerEmail, 
        limit: 1 
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing Stripe customer found", { customerId });
      } else {
        logStep("No existing Stripe customer found");
      }
    }

    // Prepare line items for Stripe using real perfume prices
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'brl',
        product_data: {
          name: `${item.brand} - ${item.name}`,
          description: `Perfume ${item.size_ml}ml`,
          metadata: {
            perfume_id: item.perfume_id,
            size_ml: item.size_ml.toString(),
          }
        },
        unit_amount: Math.round(item.unit_price * 100), // Convert real price to cents
      },
      quantity: item.quantity,
    }));

    logStep("Line items prepared", { count: lineItems.length });

    // Calculate totals for logging
    const totalAmount = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    logStep("Total amount calculated", { total: totalAmount, currency: 'BRL' });

    // Get origin for redirect URLs
    const origin = req.headers.get('origin') || 'https://localhost:5173';
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
      cancel_url: `${origin}/payment-cancel?provider=stripe`,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['BR'],
      },
      payment_intent_data: {
        metadata: {
          user_id: user?.id || 'guest',
          user_email: customerEmail,
          item_count: items.length.toString(),
        }
      },
      metadata: {
        user_id: user?.id || 'guest',
        user_email: customerEmail,
        checkout_type: 'stripe_card',
      }
    });

    logStep("Stripe checkout session created", { 
      sessionId: session.id, 
      url: session.url 
    });

    // Optionally create order draft in Supabase for tracking
    if (user?.id) {
      try {
        const supabaseService = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          { auth: { persistSession: false } }
        );

        const orderData = {
          user_id: user.id,
          stripe_session_id: session.id,
          total_amount: totalAmount,
          payment_method: 'credit_card',
          payment_status: 'pending',
          status: 'pending',
          subtotal: totalAmount,
          shipping_cost: 0,
          address_data: {}, // Will be filled from Stripe webhook or success page
        };

        const { error: orderError } = await supabaseService
          .from('orders')
          .insert(orderData);

        if (orderError) {
          logStep("Warning: Could not create order draft", orderError);
        } else {
          logStep("Order draft created successfully");
        }
      } catch (orderDraftError) {
        logStep("Warning: Order draft creation failed", orderDraftError);
        // Don't fail the checkout if order draft fails
      }
    }

    logStep("Stripe checkout completed successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        checkout_url: session.url,
        session_id: session.id,
        provider: 'stripe'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in Stripe checkout", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Erro ao processar pagamento: ${errorMessage}` 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});