
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from "https://esm.sh/stripe@14.21.0";

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

    // Pre-check inventory availability (FIFO across lots)
    const requiredMlByPerfume: Record<string, number> = {};
    for (const item of cartItems as any[]) {
      const unitMl = item.size_ml === 5 ? 5 : item.size_ml === 10 ? 10 : 50;
      requiredMlByPerfume[item.perfume_id] = (requiredMlByPerfume[item.perfume_id] || 0) + unitMl * item.quantity;
    }
    const perfumeIds = Object.keys(requiredMlByPerfume);
    let lotsByPerfume: Record<string, { id: string; qty_ml: number }[]> = {};
    if (perfumeIds.length > 0) {
      const { data: lots, error: lotsError } = await supabase
        .from('inventory_lots')
        .select('id, perfume_id, qty_ml, created_at')
        .in('perfume_id', perfumeIds)
        .order('created_at', { ascending: true });
      if (lotsError) {
        console.error('Error fetching inventory lots:', lotsError);
        return new Response(
          JSON.stringify({ error: 'Failed to check inventory' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const availableByPerfume: Record<string, number> = {};
      for (const lot of lots || []) {
        availableByPerfume[lot.perfume_id] = (availableByPerfume[lot.perfume_id] || 0) + (lot.qty_ml || 0);
      }
      for (const pid of perfumeIds) {
        const required = requiredMlByPerfume[pid] || 0;
        const available = availableByPerfume[pid] || 0;
        if (available < required) {
          console.warn('Insufficient stock for perfume', pid, 'required', required, 'available', available);
          return new Response(
            JSON.stringify({ error: 'Estoque insuficiente para um ou mais itens do carrinho' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      // Group lots by perfume for later deduction
      for (const lot of lots || []) {
        if (!lotsByPerfume[lot.perfume_id]) lotsByPerfume[lot.perfume_id] = [];
        lotsByPerfume[lot.perfume_id].push({ id: lot.id, qty_ml: lot.qty_ml });
      }
    }

    // Verify payment with Stripe if transaction_id is a Checkout Session
    const txnId = paymentData.transaction_id;
    let verifiedStatus: string = paymentData.status;
    let verifiedMethod: 'pix' | 'credit_card' = paymentData.payment_method;

    try {
      if (txnId && txnId.startsWith('cs_')) {
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
        if (!stripeKey) {
          console.warn('STRIPE_SECRET_KEY not set. Skipping Stripe verification.');
        } else {
          const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
          const session = await stripe.checkout.sessions.retrieve(txnId);

          if (session.payment_status !== 'paid') {
            return new Response(
              JSON.stringify({ error: 'Pagamento não confirmado pelo Stripe' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          verifiedStatus = 'paid';
          let usedMethod: 'pix' | 'credit_card' = 'credit_card';
          try {
            const piId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
            if (piId) {
              const pi = await stripe.paymentIntents.retrieve(piId);
              const charge = (pi.charges?.data && pi.charges.data[0]) || null;
              const pmType = charge?.payment_method_details?.type as string | undefined;
              if (pmType === 'pix') usedMethod = 'pix';
            } else if (Array.isArray(session.payment_method_types) && session.payment_method_types.includes('pix')) {
              usedMethod = 'pix';
            }
          } catch (e) {
            console.warn('Não foi possível determinar o método de pagamento Stripe. Assumindo cartão.', e?.message || e);
          }
          verifiedMethod = usedMethod;
        }
      }
    } catch (e) {
      console.error('Erro na verificação com Stripe', e);
    }

    // Create confirmed order
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

    // Deduct inventory (FIFO) and record stock movements
    for (const perfumeId of Object.keys(requiredMlByPerfume)) {
      let remaining = requiredMlByPerfume[perfumeId] || 0;
      const lots = (lotsByPerfume[perfumeId] || []).slice();
      for (const lot of lots) {
        if (remaining <= 0) break;
        const availableQty = Math.max(0, lot.qty_ml || 0);
        const consume = Math.min(remaining, availableQty);
        if (consume > 0) {
          const newQty = availableQty - consume;
          const { error: updateError } = await supabase
            .from('inventory_lots')
            .update({ qty_ml: newQty })
            .eq('id', lot.id);
          if (updateError) {
            console.error('Error updating lot qty:', lot.id, updateError);
            return new Response(
              JSON.stringify({ error: 'Falha ao atualizar estoque' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          const { error: movementError } = await supabase
            .from('stock_movements')
            .insert({
              perfume_id: perfumeId,
              lot_id: lot.id,
              change_ml: -consume,
              movement_type: 'sale',
              related_order_id: order.id,
              notes: `Baixa de estoque - Pedido ${order.order_number || order.id}`
            });
          if (movementError) {
            console.error('Error inserting stock movement:', movementError);
          }
          remaining -= consume;
        }
      }
    }

    // Clear reservations for this user (if any)
    const { error: clearReservationsError } = await supabase
      .from('reservations')
      .delete()
      .eq('user_id', orderDraft.user_id);
    if (clearReservationsError) {
      console.error('Error clearing reservations:', clearReservationsError);
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
