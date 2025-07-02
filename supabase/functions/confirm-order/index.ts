
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ConfirmOrderRequest {
  orderDraftId: string;
  paymentData: {
    transaction_id: string;
    payment_method: 'pix' | 'credit_card';
    status: string;
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
    const { orderDraftId, paymentData }: ConfirmOrderRequest = await req.json();

    if (!orderDraftId || !paymentData) {
      return new Response(
        JSON.stringify({ error: 'Order draft ID and payment data are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('=== CONFIRMING ORDER ===');
    console.log('Order Draft ID:', orderDraftId);

    // Get order draft with address
    const { data: orderDraft, error: draftError } = await supabase
      .from('order_drafts')
      .select(`
        *,
        addresses (*)
      `)
      .eq('id', orderDraftId)
      .single();

    if (draftError || !orderDraft) {
      console.error('Error fetching order draft:', draftError);
      return new Response(
        JSON.stringify({ error: 'Order draft not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        *,
        perfumes (*)
      `)
      .eq('user_id', orderDraft.user_id);

    if (cartError || !cartItems || cartItems.length === 0) {
      console.error('Error fetching cart items:', cartError);
      return new Response(
        JSON.stringify({ error: 'No items found in cart' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate totals
    const subtotal = cartItems.reduce((total, item: any) => {
      let price = item.perfumes.price_full;
      if (item.size_ml === 5) price = item.perfumes.price_5ml || 0;
      if (item.size_ml === 10) price = item.perfumes.price_10ml || 0;
      return total + (price * item.quantity);
    }, 0);

    const shippingCost = orderDraft.shipping_cost || 0;
    const totalAmount = subtotal + shippingCost;

    // Create confirmed order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: orderDraft.user_id,
        total_amount: totalAmount,
        subtotal: subtotal,
        shipping_cost: shippingCost,
        status: paymentData.status === 'paid' ? 'paid' : 'pending',
        payment_method: paymentData.payment_method,
        payment_status: paymentData.status === 'paid' ? 'paid' : 'pending',
        transaction_id: paymentData.transaction_id,
        shipping_service: orderDraft.shipping_service,
        address_data: orderDraft.addresses
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order created:', order.id);

    // Create order items
    const orderItems = cartItems.map((item: any) => {
      let unitPrice = item.perfumes.price_full;
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
      // Try to delete the order if items creation failed
      await supabase.from('orders').delete().eq('id', order.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create order items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clear user's cart
    const { error: clearCartError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', orderDraft.user_id);

    if (clearCartError) {
      console.error('Error clearing cart:', clearCartError);
    }

    // Delete order draft
    await supabase
      .from('order_drafts')
      .delete()
      .eq('id', orderDraftId);

    console.log('Order confirmation completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          total_amount: order.total_amount
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in confirm-order function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Erro interno do servidor',
        message: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
