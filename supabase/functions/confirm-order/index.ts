import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from "https://esm.sh/stripe@14.21.0";
import { 
  validateRequest,
  createErrorResponse,
  createSuccessResponse
} from '../_shared/validationMiddleware.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface ConfirmOrderRequest {
  orderDraftId: string;
  csrfToken?: string;
  paymentData: {
    transaction_id: string;
    payment_method: 'pix' | 'credit_card';
    status?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    console.log('=== CONFIRM ORDER START ===');
    
    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return createErrorResponse('Server configuration error', 500, corsHeaders);
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // FASE 4: Validação robusta com middleware
    const validation = await validateRequest(req, supabase, {
      requireAuth: false, // Pode ser guest checkout
      requireCSRF: true,
      rateLimit: {
        maxAttempts: 5,
        windowMinutes: 5
      }
    });

    if (!validation.valid) {
      console.log('Validation failed:', validation.error);
      return createErrorResponse(validation.error!, validation.statusCode!, corsHeaders);
    }

    const { user, clientIP } = validation;
    console.log('Validation passed - user:', user?.id || 'guest', 'ip:', clientIP);

    // Parse request body
    const { orderDraftId, paymentData } = await req.json() as ConfirmOrderRequest;
    const userId = user?.id;

    // Basic validation
    if (!orderDraftId || !paymentData) {
      console.error('Missing required fields:', { orderDraftId: !!orderDraftId, paymentData: !!paymentData });
      return createErrorResponse('Order draft ID and payment data are required', 400, corsHeaders);
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderDraftId)) {
      return createErrorResponse('Invalid order draft ID', 400, corsHeaders);
    }

    // Step 1: Get order draft
    console.log('Step 1: Fetching order draft:', orderDraftId);
    const { data: orderDraft, error: draftError } = await supabase
      .from('order_drafts')
      .select('*')
      .eq('id', orderDraftId)
      .single();

    if (draftError) {
      console.error('Error fetching order draft:', draftError);
      return new Response(
        JSON.stringify({ error: 'Order draft not found', details: draftError.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!orderDraft) {
      console.error('Order draft not found');
      return new Response(
        JSON.stringify({ error: 'Order draft not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order draft found:', { id: orderDraft.id, user_id: orderDraft.user_id });

    // Step 2: Get cart items
    console.log('Step 2: Fetching cart items for user:', orderDraft.user_id);
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        *,
        perfumes (
          id,
          name,
          brand,
          price_2ml,
          price_5ml,
          price_10ml,
          price_full
        )
      `)
      .eq('user_id', orderDraft.user_id);

    if (cartError) {
      console.error('Error fetching cart items:', cartError);
      return new Response(
        JSON.stringify({ error: 'Cart items not found', details: cartError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!cartItems || cartItems.length === 0) {
      console.error('No cart items found');
      return new Response(
        JSON.stringify({ error: 'No items found in cart' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Cart items found:', cartItems.length);

    // Step 3: Calculate totals
    console.log('Step 3: Calculating totals');
    const subtotal = cartItems.reduce((total, item: any) => {
      let price = item.perfumes.price_full || 0;
      if (item.size_ml === 2) price = item.perfumes.price_2ml || 0;
      if (item.size_ml === 5) price = item.perfumes.price_5ml || 0;
      if (item.size_ml === 10) price = item.perfumes.price_10ml || 0;
      return total + (price * item.quantity);
    }, 0);

    const shippingCost = orderDraft.shipping_cost || 0;
    const totalAmount = subtotal + shippingCost;

    console.log('Totals calculated:', { subtotal, shippingCost, totalAmount });

    // Step 4: Verify payment with Stripe if session ID
    const txnId = paymentData.transaction_id;
    let verifiedStatus = paymentData.status || 'pending';
    let verifiedMethod = paymentData.payment_method;

    console.log('Step 4: Payment verification starting:', { txnId, status: verifiedStatus, method: verifiedMethod });

    if (txnId && txnId.startsWith('cs_')) {
      console.log('Stripe session detected, verifying payment');
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
      
      if (stripeKey) {
        try {
          const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
          const session = await stripe.checkout.sessions.retrieve(txnId);
          console.log('Stripe session retrieved:', { 
            id: session.id, 
            payment_status: session.payment_status,
            amount_total: session.amount_total 
          });

          if (session.payment_status === 'paid') {
            verifiedStatus = 'paid';
            console.log('Payment verified as paid');
          } else {
            console.log('Payment not yet confirmed by Stripe');
            return new Response(
              JSON.stringify({ error: 'Payment not confirmed by Stripe' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (stripeError) {
          console.error('Stripe verification failed:', stripeError);
          // Continue anyway for now
        }
      } else {
        console.warn('STRIPE_SECRET_KEY not configured');
      }
    }

    // Step 5: Check for existing order
    console.log('Step 5: Checking for existing order');
    if (txnId) {
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id, order_number, status, total_amount, payment_method, payment_status')
        .eq('transaction_id', txnId)
        .maybeSingle();

      if (existingOrder) {
        console.log('Existing order found, returning:', existingOrder.id);
        return new Response(
          JSON.stringify({
            success: true,
            order: existingOrder
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Step 6: Get complete address data and create order
    console.log('Step 6: Getting complete address data and creating order');
    
    let completeAddressData = orderDraft.address_data || {};
    
    // Se temos address_id, buscar dados completos do endereço
    if (orderDraft.address_id) {
      console.log('Fetching complete address data for:', orderDraft.address_id);
      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', orderDraft.address_id)
        .maybeSingle();
      
      if (addressData && !addressError) {
        completeAddressData = {
          id: addressData.id,
          name: addressData.name,
          street: addressData.street,
          number: addressData.number,
          complement: addressData.complement,
          district: addressData.district,
          city: addressData.city,
          state: addressData.state,
          cep: addressData.cep,
          country: addressData.country || 'Brasil'
        };
        console.log('Complete address data loaded:', completeAddressData);
      } else {
        console.warn('Could not load address data:', addressError);
      }
    }
    
    // Determinar tipo de entrega
    let deliveryType = 'standard';
    if (orderDraft.shipping_service) {
      if (orderDraft.shipping_service.toLowerCase().includes('local')) {
        deliveryType = 'local_delivery';
      } else if (orderDraft.shipping_service.toLowerCase().includes('retirada') || 
                 orderDraft.shipping_service.toLowerCase().includes('pickup')) {
        deliveryType = 'pickup';
      }
    }
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: orderDraft.user_id,
        total_amount: totalAmount,
        subtotal: subtotal,
        shipping_cost: shippingCost,
        status: verifiedStatus === 'paid' ? 'paid' : 'pending',
        payment_method: verifiedMethod,
        payment_status: verifiedStatus === 'paid' ? 'paid' : 'pending',
        transaction_id: txnId,
        shipping_service: orderDraft.shipping_service,
        shipping_deadline: orderDraft.shipping_deadline,
        address_data: completeAddressData
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order', details: orderError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order created successfully:', order.id);

    // Step 7: Create order items
    console.log('Step 7: Creating order items');
    const orderItems = cartItems.map((item: any) => {
      let unitPrice = item.perfumes.price_full || 0;
      if (item.size_ml === 2) unitPrice = item.perfumes.price_2ml || 0;
      if (item.size_ml === 5) unitPrice = item.perfumes.price_5ml || 0;
      if (item.size_ml === 10) unitPrice = item.perfumes.price_10ml || 0;

      return {
        order_id: order.id,
        perfume_id: item.perfume_id,
        size_ml: item.size_ml,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: unitPrice * item.quantity
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Try to clean up the order
      await supabase.from('orders').delete().eq('id', order.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create order items', details: itemsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 8: Process stock movement
    console.log('Step 8: Processing stock movement');
    try {
      const { data: stockResult, error: stockError } = await supabase
        .rpc('process_order_stock_movement', { order_uuid: order.id });
      
      if (stockError) {
        console.warn('Stock movement error:', stockError);
        // Don't fail the order for stock movement issues
      } else {
        console.log('Stock movement result:', stockResult);
      }
    } catch (stockError) {
      console.warn('Stock movement processing failed:', stockError);
      // Don't fail the request for stock movement issues
    }

    // Step 9: Clear cart and order draft
    console.log('Step 9: Cleaning up cart and order draft');
    try {
      await supabase.from('cart_items').delete().eq('user_id', orderDraft.user_id);
      await supabase.from('order_drafts').delete().eq('id', orderDraftId);
    } catch (cleanupError) {
      console.warn('Cleanup warning:', cleanupError);
      // Don't fail the request for cleanup issues
    }

    // Step 10: Auto-generate NF-e if payment is confirmed
    if (verifiedStatus === 'paid') {
      console.log('Step 10: Auto-generating NF-e for paid order');
      try {
        const { data: nfeResult, error: nfeError } = await supabase.functions.invoke('generate-nfe', {
          body: { order_id: order.id }
        });

        if (nfeError) {
          console.warn('NF-e auto-generation failed:', nfeError);
          // Don't fail the order confirmation for NF-e issues
        } else {
          console.log('NF-e auto-generated successfully:', nfeResult);
        }
      } catch (nfeError) {
        console.warn('NF-e auto-generation error:', nfeError);
        // Don't fail the order confirmation for NF-e issues
      }
    }

    console.log('Order confirmation completed successfully');

    // Log security audit event
    try {
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: userId || null,
          event_type: 'sensitive_data_access',
          event_description: `Pedido confirmado: ${order.order_number}`,
          risk_level: 'low',
          resource_type: 'order',
          resource_id: order.id,
          ip_address: clientIP,
          user_agent: req.headers.get('user-agent'),
          metadata: {
            order_id: order.id,
            order_number: order.order_number,
            total_amount: totalAmount,
            payment_method: verifiedMethod,
            payment_status: verifiedStatus,
            items_count: cartItems.length
          }
        });
    } catch (auditError) {
      console.warn('Failed to log audit event:', auditError);
    }

    return createSuccessResponse({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        total_amount: order.total_amount,
        subtotal: order.subtotal,
        shipping_cost: order.shipping_cost,
        shipping_service: order.shipping_service,
        payment_method: order.payment_method,
        address_data: completeAddressData
      }
    }, corsHeaders);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Unexpected error in confirm-order function:', error);
    
    return createErrorResponse(
      'Internal server error: ' + errorMessage,
      500,
      corsHeaders
    );
  }
});