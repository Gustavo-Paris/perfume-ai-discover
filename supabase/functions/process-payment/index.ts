
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
    const modoBankSecretKey = Deno.env.get('MODO_BANK_SECRET_KEY');
    const modoBankPublicKey = Deno.env.get('MODO_BANK_PUBLIC_KEY');

    console.log('=== MODO BANK CREDENTIALS CHECK ===');
    console.log('Secret Key exists:', !!modoBankSecretKey);
    console.log('Public Key exists:', !!modoBankPublicKey);

    if (!modoBankSecretKey || !modoBankPublicKey) {
      console.log('Missing Modo Bank credentials - using mock data');
      
      if (paymentMethod === 'pix') {
        const mockPixResponse: PixResponse = {
          qr_code: '00020126580014BR.GOV.BCB.PIX013662345678-1234-1234-1234-12345678901052040000530398654041.235802BR5925Perfumes Paris Co6009Sao Paulo62070503***6304ABCD',
          qr_code_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
        };

        return new Response(
          JSON.stringify({ 
            success: true,
            payment_method: 'pix',
            ...mockPixResponse,
            debug: { message: 'Credenciais do Modo Bank não configuradas - dados simulados' }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        const mockCardResponse: CardResponse = {
          status: 'paid',
          transaction_id: 'mock_txn_' + Date.now()
        };

        return new Response(
          JSON.stringify({ 
            success: true,
            payment_method: 'credit_card',
            ...mockCardResponse,
            debug: { message: 'Credenciais do Modo Bank não configuradas - dados simulados' }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Prepare payment data for Modo Bank
    const paymentData = {
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'BRL',
      customer: {
        external_id: orderDraft.user_id,
        name: orderDraft.addresses?.name || 'Cliente',
        email: 'cliente@example.com', // You might want to get this from user profile
        phone: '11999999999' // You might want to get this from user profile or address
      },
      billing: {
        name: orderDraft.addresses?.name || 'Cliente',
        address: {
          street: orderDraft.addresses?.street || '',
          street_number: orderDraft.addresses?.number || '',
          neighborhood: orderDraft.addresses?.district || '',
          city: orderDraft.addresses?.city || '',
          state: orderDraft.addresses?.state || '',
          zipcode: orderDraft.addresses?.cep?.replace(/\D/g, '') || '',
          country: 'BR'
        }
      },
      items: cartItems?.map((item: any) => ({
        id: item.perfume_id,
        title: `${item.perfumes.brand} - ${item.perfumes.name}`,
        unit_price: Math.round((item.size_ml === 5 ? item.perfumes.price_5ml : 
                               item.size_ml === 10 ? item.perfumes.price_10ml : 
                               item.perfumes.price_full) * 100),
        quantity: item.quantity,
        tangible: true
      })) || []
    };

    console.log('=== MODO BANK PAYMENT REQUEST ===');
    console.log('Payment Method:', paymentMethod);
    console.log('Total Amount (cents):', paymentData.amount);

    if (paymentMethod === 'pix') {
      // Create PIX payment
      const pixPaymentData = {
        ...paymentData,
        payment_method: 'pix',
        pix_expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      };

      const response = await fetch('https://api.pagar.me/core/v5/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(modoBankSecretKey + ':')}`
        },
        body: JSON.stringify(pixPaymentData)
      });

      const result = await response.json();
      console.log('Modo Bank PIX Response:', result);

      if (!response.ok) {
        throw new Error(`Modo Bank API Error: ${result.message || 'Unknown error'}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          payment_method: 'pix',
          qr_code: result.pix_qr_code,
          qr_code_url: result.pix_qr_code_url,
          expires_at: result.pix_expiration_date,
          transaction_id: result.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (paymentMethod === 'credit_card') {
      // Create credit card payment
      if (!cardData) {
        return new Response(
          JSON.stringify({ error: 'Card data is required for credit card payments' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const cardPaymentData = {
        ...paymentData,
        payment_method: 'credit_card',
        card: {
          number: cardData.number.replace(/\s/g, ''),
          holder_name: cardData.holder_name,
          exp_month: parseInt(cardData.exp_month),
          exp_year: parseInt(cardData.exp_year),
          cvv: cardData.cvv
        },
        installments: installments || 1
      };

      const response = await fetch('https://api.pagar.me/core/v5/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(modoBankSecretKey + ':')}`
        },
        body: JSON.stringify(cardPaymentData)
      });

      const result = await response.json();
      console.log('Modo Bank Card Response:', result);

      if (!response.ok) {
        throw new Error(`Modo Bank API Error: ${result.message || 'Unknown error'}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          payment_method: 'credit_card',
          status: result.status,
          transaction_id: result.id,
          installments: result.installments
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
