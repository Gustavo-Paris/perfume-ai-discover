
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
  order_draft_id?: string;
  payment_method?: 'pix' | 'card';
  success_url?: string;
  cancel_url?: string;
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
const { items, user_email, order_draft_id, payment_method, success_url, cancel_url }: CheckoutRequest = await req.json();
const method: 'pix' | 'card' = payment_method === 'pix' ? 'pix' : 'card';
logStep("Checkout request parsed", { itemCount: items.length, hasDraft: !!order_draft_id, method });

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
    let lineItems = items.map(item => ({
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

    // Enrich with shipping and prefill address from order draft
    let shippingCost = 0;
    let shippingService: string | null = null;
    let addressData: any = null;

    if (order_draft_id && user?.id) {
      // Use service role to read protected tables securely
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );

      const { data: draft, error: draftErr } = await supabaseService
        .from('order_drafts')
        .select('id, shipping_cost, shipping_service, address_id')
        .eq('id', order_draft_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (draftErr) {
        logStep("Warning: failed to load order draft", { message: draftErr.message });
      } else if (draft) {
        shippingCost = Number(draft.shipping_cost || 0);
        shippingService = draft.shipping_service || null;
        if (draft.address_id) {
          const { data: addr, error: addrErr } = await supabaseService
            .from('addresses')
            .select('*')
            .eq('id', draft.address_id)
            .eq('user_id', user.id)
            .maybeSingle();
          if (!addrErr && addr) {
            addressData = addr;
            logStep("Address loaded for prefill", { addressId: addr.id });
          }
        }
      }
    }

    // Add shipping as a line item when applicable
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'brl',
          product_data: {
            name: `Frete${shippingService ? ` - ${shippingService}` : ''}`,
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
      logStep("Shipping line item added", { shippingCost, shippingService });
    }

    // Calculate totals for logging (now including shipping)
    const itemsTotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const totalAmount = itemsTotal + shippingCost;
    logStep("Total amount calculated", { itemsTotal, shippingCost, total: totalAmount, currency: 'BRL' });

    // Update or create Stripe customer with address to prefill checkout
    if (addressData) {
      logStep('Address data for customer prefill', { 
        street: addressData.street,
        number: addressData.number,
        city: addressData.city,
        state: addressData.state,
        cep: addressData.cep,
        district: addressData.district,
        complement: addressData.complement,
        name: addressData.name
      });
      
      // Validate required address fields
      if (!addressData.street || !addressData.number || !addressData.city || !addressData.state || !addressData.cep) {
        logStep('Address validation failed - missing required fields', {
          hasStreet: !!addressData.street,
          hasNumber: !!addressData.number, 
          hasCity: !!addressData.city,
          hasState: !!addressData.state,
          hasCep: !!addressData.cep
        });
        throw new Error('Dados de endereço incompletos');
      }
      
      const customerPayload: any = {
        name: addressData.name || undefined,
        address: {
          line1: `${addressData.street}, ${addressData.number}`,
          line2: addressData.complement ? `${addressData.district} - ${addressData.complement}` : addressData.district,
          city: addressData.city,
          state: addressData.state,
          postal_code: addressData.cep.replace(/\D/g, ''), // Remove non-digits
          country: 'BR',
        },
        shipping: {
          address: {
            line1: `${addressData.street}, ${addressData.number}`,
            line2: addressData.complement ? `${addressData.district} - ${addressData.complement}` : addressData.district,
            city: addressData.city,
            state: addressData.state,
            postal_code: addressData.cep.replace(/\D/g, ''), // Remove non-digits
            country: 'BR',
          },
          name: addressData.name || undefined,
        }
      };
      
      logStep('Customer payload prepared', { payload: customerPayload });
      
      try {
        if (customerId) {
          await stripe.customers.update(customerId, customerPayload);
          logStep("Stripe customer updated with address", { customerId });
        } else {
          const newCustomer = await stripe.customers.create({
            email: customerEmail,
            ...customerPayload,
          });
          customerId = newCustomer.id;
          logStep("Stripe customer created with address", { customerId });
        }
      } catch (e) {
        logStep("Warning: customer address prefill failed", { message: (e as Error).message, stack: (e as Error).stack });
      }
    }

    // Get origin for redirect URLs and build success/cancel
    const origin = req.headers.get('origin') || 'http://localhost:5173';
    let successUrl = success_url || `${origin}/payment-success`;
    let cancelUrl = cancel_url || `${origin}/payment-cancel`;
    if (!successUrl.includes('{CHECKOUT_SESSION_ID}')) {
      const sep = successUrl.includes('?') ? '&' : '?';
      successUrl = `${successUrl}${sep}session_id={CHECKOUT_SESSION_ID}`;
    }
    successUrl = `${successUrl}&payment_method=${method}${order_draft_id ? `&order_draft_id=${order_draft_id}` : ''}`;
    const sep2 = cancelUrl.includes('?') ? '&' : '?';
    cancelUrl = `${cancelUrl}${sep2}payment_method=${method}${order_draft_id ? `&order_draft_id=${order_draft_id}` : ''}`;
    
    // Create Stripe checkout session
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : customerEmail,
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        payment_method_types: method === 'pix' ? ['pix'] : ['card'],
      billing_address_collection: addressData ? 'auto' : 'required',
      shipping_address_collection: addressData ? undefined : {
        allowed_countries: ['BR'],
      },
      customer_update: {
        address: 'auto',
        name: 'auto',
        shipping: 'auto'
      },
      payment_intent_data: {
        metadata: {
          user_id: user?.id || 'guest',
          user_email: customerEmail,
          item_count: items.length.toString(),
          selected_payment_method: method,
          ...(order_draft_id ? { order_draft_id } : {}),
        }
      },
      metadata: {
        user_id: user?.id || 'guest',
        user_email: customerEmail,
        checkout_type: 'stripe_checkout',
        selected_payment_method: method,
        ...(order_draft_id ? { order_draft_id } : {}),
        }
      });

      logStep("Stripe checkout session created", { 
        sessionId: session.id, 
        url: session.url 
      });
    } catch (stripeError: any) {
      // Handle specific PIX activation error
      if (stripeError.message && stripeError.message.includes('pix is invalid')) {
        logStep("PIX payment method not activated in Stripe dashboard");
        throw new Error('PIX não está ativado no Stripe. Ative PIX no dashboard do Stripe em: Configurações > Métodos de Pagamento > PIX');
      }
      // Re-throw other Stripe errors
      throw stripeError;
    }

    // Optionally create order draft in Supabase for tracking
    // Avoid duplicate orders when we already have an order_draft_id (webhook/confirm-order will finalize it)
    if (user?.id && !order_draft_id) {
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
          payment_method: method === 'pix' ? 'pix' : 'credit_card',
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
