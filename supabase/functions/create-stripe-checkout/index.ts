
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  validateCSRFToken,
  checkRateLimit,
  logSecurityEvent,
  validateAndSanitizeCheckoutItems,
  getClientIP,
  sanitizeString
} from "../_shared/security.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";

interface CheckoutItem {
  perfume_id: string;
  name: string;
  brand: string;
  size_ml: number;
  quantity: number;
  unit_price: number;
}

interface CheckoutRequest {
  csrfToken?: string;
  items: CheckoutItem[];
  user_email?: string;
  order_draft_id?: string;
  payment_method?: 'pix' | 'card';
  success_url?: string;
  cancel_url?: string;
}

// Logger instance - replaces verbose console.log statements
const logger = createLogger('stripe-checkout');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    logger.start();

    // Check for Stripe secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      logger.error("STRIPE_SECRET_KEY not configured");
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
      logger.debug("User authenticated", { userId: user?.id });
    } else {
      logger.debug("Guest checkout mode");
    }

// Parse request body
const requestBody: CheckoutRequest = await req.json();
const { csrfToken, items, user_email, order_draft_id, payment_method, success_url, cancel_url } = requestBody;

    // SECURITY: Validar CSRF token
    if (!validateCSRFToken(csrfToken)) {
      logger.warn("CSRF token validation failed");
      await logSecurityEvent(
        supabase,
        user?.id || null,
        'csrf_validation_failed',
        'CSRF token inválido no checkout',
        'high',
        { endpoint: 'create-stripe-checkout' }
      );
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Token de segurança inválido. Recarregue a página.' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // SECURITY: Rate limiting (3 tentativas por 5 minutos)
    const clientIP = getClientIP(req);
    const rateLimit = await checkRateLimit(
      supabase,
      user?.id || null,
      clientIP,
      'checkout-attempt',
      3,
      5
    );

    if (!rateLimit.allowed) {
      logger.warn("Rate limit exceeded", { userId: user?.id, ip: clientIP });
      await logSecurityEvent(
        supabase,
        user?.id || null,
        'rate_limit_exceeded',
        'Rate limit excedido no checkout',
        'medium',
        { endpoint: 'create-stripe-checkout', ip: clientIP }
      );
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Muitas tentativas de pagamento. Tente novamente em alguns minutos.' 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    // SECURITY: Validar e sanitizar items
    let sanitizedItems;
    try {
      sanitizedItems = validateAndSanitizeCheckoutItems(items);
      logger.debug("Items validated", { count: sanitizedItems.length });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Items inválidos';
      logger.warn("Invalid checkout items", { error: errorMsg });
      await logSecurityEvent(
        supabase,
        user?.id || null,
        'invalid_checkout_data',
        'Dados de checkout inválidos',
        'medium',
        { error: errorMsg, ip: clientIP }
      );
      return new Response(
        JSON.stringify({ 
          success: false,
          error: errorMsg
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

const method: 'pix' | 'card' = payment_method === 'pix' ? 'pix' : 'card';
logger.debug("Checkout request parsed", { itemCount: sanitizedItems.length, hasDraft: !!order_draft_id, method });

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });
    logger.debug("Stripe initialized");

    // Determine customer email - para guest checkout, gerar email único
    // Isso evita duplicação de customers no Stripe
    const guestEmail = user_email || `guest-${crypto.randomUUID().slice(0, 8)}@checkout.temp`;
    const customerEmail = user?.email || guestEmail;
    const isGuestCheckout = !user?.email;
    logger.debug("Customer email determined", { email: customerEmail, isGuest: isGuestCheckout });

    // Check if Stripe customer exists (only for authenticated users)
    let customerId: string | undefined;
    if (!isGuestCheckout) {
      const customers = await stripe.customers.list({
        email: customerEmail,
        limit: 1
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logger.debug("Existing Stripe customer found", { customerId });
      } else {
        logger.debug("No existing Stripe customer found");
      }
    } else {
      logger.debug("Guest checkout - skipping customer lookup");
    }

    // Prepare line items for Stripe using sanitized data
    let lineItems = sanitizedItems.map(item => ({
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

    logger.debug("Line items prepared", { count: lineItems.length });

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
        logger.warn("Failed to load order draft", { message: draftErr.message });
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
            logger.debug("Address loaded for prefill", { addressId: addr.id });
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
            description: 'Serviço de entrega',
            metadata: {
              perfume_id: 'shipping',
              size_ml: '0'
            }
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
      logger.debug("Shipping line item added", { shippingCost, shippingService });
    }

    // Calculate totals for logging (now including shipping)
    const itemsTotal = sanitizedItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const totalAmount = itemsTotal + shippingCost;
    logger.debug("Total amount calculated", { itemsTotal, shippingCost, total: totalAmount, currency: 'BRL' });

    // Update or create Stripe customer with address to prefill checkout
    if (addressData) {
      logger.debug('Address data for customer prefill', { 
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
        logger.debug('Address validation failed - missing required fields', {
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
      
      logger.debug('Customer payload prepared', { payload: customerPayload });
      
      try {
        if (customerId) {
          await stripe.customers.update(customerId, customerPayload);
          logger.debug("Stripe customer updated with address", { customerId });
        } else {
          const newCustomer = await stripe.customers.create({
            email: customerEmail,
            ...customerPayload,
          });
          customerId = newCustomer.id;
          logger.debug("Stripe customer created with address", { customerId });
        }
      } catch (e) {
        logger.warn("Customer address prefill failed", { message: (e as Error).message });
      }
    }

    // Get origin for redirect URLs and build success/cancel
    // IMPORTANTE: O origin deve sempre vir do header da requisição em produção
    const requestOrigin = req.headers.get('origin');
    if (!requestOrigin) {
      logger.warn("No origin header - using referer or default");
    }
    const origin = requestOrigin || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://parisandco.com.br';
    let successUrl = success_url || `${origin}/payment-success`;
    let cancelUrl = cancel_url || `${origin}/checkout`;
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
            item_count: sanitizedItems.length.toString(),
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

      logger.debug("Stripe checkout session created", { 
        sessionId: session.id, 
        url: session.url 
      });
    } catch (stripeError: any) {
      // Handle specific PIX activation error
      if (stripeError.message && stripeError.message.includes('pix is invalid')) {
        logger.error("PIX payment method not activated in Stripe dashboard");
        throw new Error('PIX não está ativado no Stripe. Ative PIX no dashboard do Stripe em: Configurações > Métodos de Pagamento > PIX');
      }
      // Re-throw other Stripe errors
      throw stripeError;
    }

    // Optionally create order draft in Supabase for tracking
    // Avoid duplicate orders when we already have an order_draft_id (webhook/confirm-order will finalize it)
    if (user?.id && !order_draft_id && session) {
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
          logger.warn("Could not create order draft", { error: orderError });
        } else {
          logger.debug("Order draft created successfully");
        }
      } catch (orderDraftError) {
        logger.warn("Order draft creation failed", { error: orderDraftError });
        // Don't fail the checkout if order draft fails
      }
    }

    logger.success("Stripe checkout completed");

    // Log security audit event
    try {
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );
      
      await supabaseService
        .from('security_audit_log')
        .insert({
          user_id: user?.id || null,
          event_type: 'sensitive_data_access',
          event_description: `Checkout criado via Stripe (${method})`,
          risk_level: 'low',
          resource_type: 'checkout',
          resource_id: session?.id || null,
          ip_address: clientIP,
          user_agent: req.headers.get('user-agent'),
          metadata: {
            session_id: session?.id,
            item_count: sanitizedItems.length,
            total_amount: totalAmount,
            payment_method: method,
            order_draft_id: order_draft_id || null,
            customer_email: customerEmail
          }
        });
    } catch (auditError) {
      logger.warn("Failed to log audit event", { error: auditError });
    }

    // Log security event de sucesso
    await logSecurityEvent(
      supabase,
      user?.id || null,
      'checkout_success',
      'Checkout completado com sucesso',
      'low',
      { 
        sessionId: session?.id, 
        itemCount: sanitizedItems.length,
        totalAmount,
        method 
      }
    );

    // Ensure session was created successfully
    if (!session) {
      throw new Error('Falha na criação da sessão de checkout');
    }

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
    logger.debug("ERROR in Stripe checkout", { message: errorMessage });
    
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
