import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from "https://esm.sh/stripe@14.21.0";

interface ConfirmOrderRequest {
  orderDraftId: string;
  paymentData: {
    transaction_id: string;
    payment_method: 'pix' | 'credit_card';
    status?: string;
  };
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== CONFIRM ORDER START ===');
    
    // Parse request
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request received:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { orderDraftId, paymentData }: ConfirmOrderRequest = requestBody;

    if (!orderDraftId || !paymentData) {
      console.error('Missing required fields:', { orderDraftId: !!orderDraftId, paymentData: !!paymentData });
      return new Response(
        JSON.stringify({ error: 'Order draft ID and payment data are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseKey?.length || 0
    });
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Step 6: Create order
    console.log('Step 6: Creating new order');
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
        address_data: orderDraft.address_data || {}
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

    // Step 8: Clear cart and order draft
    console.log('Step 8: Cleaning up cart and order draft');
    try {
      await supabase.from('cart_items').delete().eq('user_id', orderDraft.user_id);
      await supabase.from('order_drafts').delete().eq('id', orderDraftId);
    } catch (cleanupError) {
      console.warn('Cleanup warning:', cleanupError);
      // Don't fail the request for cleanup issues
    }

    console.log('Order confirmation completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          payment_status: order.payment_status,
          total_amount: order.total_amount,
          payment_method: order.payment_method
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in confirm-order function:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: error.message,
        errorName: error.name
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});