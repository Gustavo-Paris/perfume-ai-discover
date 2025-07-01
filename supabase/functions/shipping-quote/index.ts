
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MELHOR_ENVIO_API = 'https://sandbox.melhorenvio.com.br/api/v2/me';
const MELHOR_ENVIO_CALC_API = 'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate';

interface ShippingQuoteRequest {
  orderDraftId: string;
}

interface ShippingQuote {
  service: string;
  price: number;
  deadline: number;
  company: string;
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
    const { orderDraftId }: ShippingQuoteRequest = await req.json();

    if (!orderDraftId) {
      return new Response(
        JSON.stringify({ error: 'Order draft ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get order draft with address and cart items
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

    // Get cart items for the user
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

    // Get Melhor Envio credentials - now we only need the token
    const melhorEnvioToken = Deno.env.get('MELHOR_ENVIO_TOKEN');
    
    console.log('=== MELHOR ENVIO TOKEN CHECK ===');
    console.log('Token exists:', !!melhorEnvioToken);
    console.log('Token length:', melhorEnvioToken?.length || 0);
    
    if (!melhorEnvioToken) {
      console.log('Missing Melhor Envio token - using mock data');
      
      const mockQuotes: ShippingQuote[] = [
        {
          service: 'PAC (Token Ausente)',
          price: 15.90,
          deadline: 8,
          company: 'Correios'
        },
        {
          service: 'SEDEX (Token Ausente)',
          price: 25.50,
          deadline: 3,
          company: 'Correios'
        }
      ];

      return new Response(
        JSON.stringify({ 
          quotes: mockQuotes,
          debug: {
            message: 'Token do Melhor Envio não configurado',
            missing: { token: true }
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate package dimensions and weight
    const totalWeight = cartItems?.reduce((total, item) => {
      const itemWeight = item.size_ml * 1.2; // aproximadamente 1.2g por ml
      return total + (itemWeight * item.quantity);
    }, 0) || 100;

    const packageDimensions = {
      height: 15,
      width: 20,
      length: 25
    };

    // Clean CEP (remove formatting)
    const destinationCep = orderDraft.addresses.cep.replace(/\D/g, '');

    // Prepare shipping calculation request according to Melhor Envio API docs
    const shippingRequest = {
      from: {
        postal_code: "01310-100" // CEP de origem (São Paulo)
      },
      to: {
        postal_code: destinationCep
      },
      products: [{
        id: "1",
        width: packageDimensions.width,
        height: packageDimensions.height,
        length: packageDimensions.length,
        weight: Math.max(totalWeight / 1000, 0.1), // Convert to kg, minimum 100g
        insurance_value: 100, // Valor do seguro
        quantity: 1
      }],
      options: {
        receipt: false,
        own_hand: false
      },
      services: "1,2" // 1 = PAC, 2 = SEDEX
    };

    console.log('=== MELHOR ENVIO CALCULATION REQUEST ===');
    console.log('Destination CEP:', destinationCep);
    console.log('Package weight (kg):', Math.max(totalWeight / 1000, 0.1));
    console.log('Request payload:', JSON.stringify(shippingRequest, null, 2));

    // Call Melhor Envio API directly with user token
    const response = await fetch(MELHOR_ENVIO_CALC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${melhorEnvioToken}`,
        'User-Agent': 'Aplicação perfumes@exemplo.com'
      },
      body: JSON.stringify(shippingRequest)
    });

    console.log('=== MELHOR ENVIO API RESPONSE ===');
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Melhor Envio API error:', response.status, errorText);
      
      const fallbackQuotes: ShippingQuote[] = [
        {
          service: 'PAC (Erro na API)',
          price: 15.90,
          deadline: 8,
          company: 'Correios'
        },
        {
          service: 'SEDEX (Erro na API)',
          price: 25.50,
          deadline: 3,
          company: 'Correios'
        }
      ];

      return new Response(
        JSON.stringify({ 
          quotes: fallbackQuotes,
          debug: {
            error: `Melhor Envio API Error: ${response.status}`,
            message: errorText,
            cep: destinationCep,
            weight: Math.max(totalWeight / 1000, 0.1)
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const shippingData = await response.json();
    console.log('Melhor Envio response data:', JSON.stringify(shippingData, null, 2));

    // Format response to match our interface
    const quotes: ShippingQuote[] = [];

    if (Array.isArray(shippingData)) {
      shippingData.forEach((option: any) => {
        if (option.price && option.delivery_time) {
          quotes.push({
            service: option.name || option.company?.name || 'Serviço',
            price: parseFloat(option.price),
            deadline: parseInt(option.delivery_time),
            company: option.company?.name || 'Transportadora'
          });
        }
      });
    }

    console.log('Final processed quotes:', quotes);

    if (quotes.length === 0) {
      console.log('No valid quotes found, returning fallback data');
      const fallbackQuotes: ShippingQuote[] = [
        {
          service: 'PAC (Sem Cotações Válidas)',
          price: 15.90,
          deadline: 8,
          company: 'Correios'
        },
        {
          service: 'SEDEX (Sem Cotações Válidas)',
          price: 25.50,
          deadline: 3,
          company: 'Correios'
        }
      ];

      return new Response(
        JSON.stringify({ 
          quotes: fallbackQuotes,
          debug: {
            originalResponse: shippingData,
            message: 'Nenhuma cotação válida encontrada na resposta da API'
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ quotes }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in shipping-quote function:', error);
    
    const fallbackQuotes: ShippingQuote[] = [
      {
        service: 'PAC (Erro Interno)',
        price: 15.90,
        deadline: 8,
        company: 'Correios'
      },
      {
        service: 'SEDEX (Erro Interno)',
        price: 25.50,
        deadline: 3,
        company: 'Correios'
      }
    ];
    
    return new Response(
      JSON.stringify({ 
        quotes: fallbackQuotes,
        debug: {
          error: 'Erro interno da função',
          message: error.message
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
