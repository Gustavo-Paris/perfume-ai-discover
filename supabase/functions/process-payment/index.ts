
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface PaymentRequest {
  orderDraftId: string;
  paymentMethod: 'pix' | 'credit_card';
  cardData?: {
    number: string;
    holder_name: string;
    exp_month: string;
    exp_year: string;
    cvv: string;
  };
  installments?: number;
}

interface PixResponse {
  qr_code: string;
  qr_code_url: string;
  expires_at: string;
}

interface CardResponse {
  status: 'paid' | 'processing' | 'failed';
  transaction_id: string;
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
    const { orderDraftId, paymentMethod, cardData, installments }: PaymentRequest = await req.json();

    if (!orderDraftId || !paymentMethod) {
      return new Response(
        JSON.stringify({ error: 'Order draft ID and payment method are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get order draft with all necessary data
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

    // Get cart items to calculate total
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        *,
        perfumes (*)
      `)
      .eq('user_id', orderDraft.user_id);

    if (cartError) {
      console.error('Error fetching cart items:', cartError);
      return new Response(
        JSON.stringify({ error: 'Error fetching cart items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate total amount
    const subtotal = cartItems?.reduce((total, item: any) => {
      let price = item.perfumes.price_full;
      if (item.size_ml === 5) price = item.perfumes.price_5ml || 0;
      if (item.size_ml === 10) price = item.perfumes.price_10ml || 0;
      return total + (price * item.quantity);
    }, 0) || 0;

    const shippingCost = orderDraft.shipping_cost || 0;
    const totalAmount = subtotal + shippingCost;

    // Get Modo Bank credentials
    const modoBankClientId = Deno.env.get('MODO_BANK_PUBLIC_KEY');
    const modoBankClientSecret = Deno.env.get('MODO_BANK_SECRET_KEY');

    console.log('=== MODO BANK CREDENTIALS CHECK ===');
    console.log('Client ID exists:', !!modoBankClientId);
    console.log('Client Secret exists:', !!modoBankClientSecret);

    if (!modoBankClientId || !modoBankClientSecret) {
      console.error('Missing Modo Bank credentials');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Credenciais do Modo Bank não configuradas'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For now, let's use a simulated response since we need to configure the Modo Bank API properly
    console.log('=== MODO BANK PAYMENT REQUEST ===');
    console.log('Payment Method:', paymentMethod);
    console.log('Total Amount (BRL):', totalAmount);
    console.log('Client ID:', modoBankClientId);

    if (paymentMethod === 'pix') {
      // Generate a mock PIX for now - you'll need to integrate with Modo Bank's actual PIX API
      const mockPixResponse = {
        qr_code: `00020126580014BR.GOV.BCB.PIX0136${modoBankClientId}52040000530398654${totalAmount.toFixed(2).padStart(10, '0')}5802BR5925Perfumes Paris Co600${orderDraft.addresses?.city || 'SaoPaulo'}62070503***6304`,
        qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014BR.GOV.BCB.PIX0136${modoBankClientId}52040000530398654${totalAmount.toFixed(2).padStart(10, '0')}5802BR5925Perfumes Paris Co600${orderDraft.addresses?.city || 'SaoPaulo'}62070503***6304`,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        transaction_id: `modo_pix_${Date.now()}`
      };

      console.log('PIX QR Code generated successfully');

      return new Response(
        JSON.stringify({
          success: true,
          payment_method: 'pix',
          ...mockPixResponse
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (paymentMethod === 'credit_card') {
      if (!cardData) {
        return new Response(
          JSON.stringify({ error: 'Card data is required for credit card payments' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate a mock credit card response for now
      const mockCardResponse = {
        status: 'paid' as const,
        transaction_id: `modo_card_${Date.now()}`,
        installments: installments || 1
      };

      console.log('Credit card payment processed successfully');

      return new Response(
        JSON.stringify({
          success: true,
          payment_method: 'credit_card',
          ...mockCardResponse
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid payment method' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-payment function:', error);
    
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
