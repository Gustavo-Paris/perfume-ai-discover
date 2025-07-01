
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MELHOR_ENVIO_API = 'https://sandbox.melhorenvio.com.br/api/v2/me';

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

    // Get Melhor Envio token
    const melhorEnvioToken = Deno.env.get('MELHOR_ENVIO_TOKEN');
    console.log('=== MELHOR ENVIO DEBUG ===');
    console.log('Token exists:', !!melhorEnvioToken);
    console.log('Token length:', melhorEnvioToken?.length || 0);
    console.log('Token first 20 chars:', melhorEnvioToken?.substring(0, 20) + '...');
    console.log('API URL:', MELHOR_ENVIO_API);
    
    if (!melhorEnvioToken) {
      console.log('MELHOR_ENVIO_TOKEN not found - using mock data');
      
      const mockQuotes: ShippingQuote[] = [
        {
          service: 'PAC (Mock - No Token)',
          price: 15.90,
          deadline: 8,
          company: 'Correios'
        },
        {
          service: 'SEDEX (Mock - No Token)',
          price: 25.50,
          deadline: 3,
          company: 'Correios'
        }
      ];

      return new Response(
        JSON.stringify({ quotes: mockQuotes }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate package dimensions and weight
    const totalWeight = cartItems?.reduce((total, item) => {
      const itemWeight = item.size_ml * 1.2;
      return total + (itemWeight * item.quantity);
    }, 0) || 100;

    const packageDimensions = {
      height: 15,
      width: 20,
      length: 25
    };

    // Prepare shipping calculation request
    const shippingRequest = {
      from: {
        postal_code: "01310-100" // CEP de origem (substitua pelo seu CEP)
      },
      to: {
        postal_code: orderDraft.addresses.cep.replace(/\D/g, '')
      },
      package: {
        height: packageDimensions.height,
        width: packageDimensions.width,
        length: packageDimensions.length,
        weight: Math.max(totalWeight / 1000, 0.1)
      }
    };

    console.log('Shipping request payload:', JSON.stringify(shippingRequest, null, 2));

    // Test token validity with a simple endpoint first
    console.log('=== TESTING TOKEN VALIDITY ===');
    const testResponse = await fetch(`${MELHOR_ENVIO_API}/shipment/services`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${melhorEnvioToken}`,
        'User-Agent': 'Aplicação teste@exemplo.com'
      }
    });

    console.log('Token test response status:', testResponse.status);
    if (!testResponse.ok) {
      const testErrorText = await testResponse.text();
      console.error('Token test failed:', testResponse.status, testErrorText);
      
      // Try to parse error details
      let errorDetails;
      try {
        errorDetails = JSON.parse(testErrorText);
        console.log('Parsed error details:', JSON.stringify(errorDetails, null, 2));
      } catch (e) {
        console.log('Could not parse error response as JSON');
      }
      
      const fallbackQuotes: ShippingQuote[] = [
        {
          service: 'PAC (Token Invalid)',
          price: 15.90,
          deadline: 8,
          company: 'Correios'
        },
        {
          service: 'SEDEX (Token Invalid)',
          price: 25.50,
          deadline: 3,
          company: 'Correios'
        }
      ];

      return new Response(
        JSON.stringify({ 
          quotes: fallbackQuotes,
          debug: {
            error: `Token validation failed: ${testResponse.status}`,
            message: testErrorText,
            details: errorDetails
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Token is valid, proceeding with shipping calculation');

    // Call Melhor Envio API for shipping calculation
    const response = await fetch(`${MELHOR_ENVIO_API}/shipment/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${melhorEnvioToken}`,
        'User-Agent': 'Aplicação teste@exemplo.com'
      },
      body: JSON.stringify(shippingRequest)
    });

    console.log('Shipping calculation response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shipping calculation API error:', response.status, errorText);
      
      const fallbackQuotes: ShippingQuote[] = [
        {
          service: 'PAC (Calc Error)',
          price: 15.90,
          deadline: 8,
          company: 'Correios'
        },
        {
          service: 'SEDEX (Calc Error)',
          price: 25.50,
          deadline: 3,
          company: 'Correios'
        }
      ];

      return new Response(
        JSON.stringify({ 
          quotes: fallbackQuotes,
          debug: {
            error: `Calculation API Error: ${response.status}`,
            message: errorText
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const shippingData = await response.json();
    console.log('Shipping calculation success:', JSON.stringify(shippingData, null, 2));

    // Format response to match our interface
    const quotes: ShippingQuote[] = [];

    if (Array.isArray(shippingData)) {
      shippingData.forEach((option: any) => {
        if (option.price && option.delivery_time) {
          quotes.push({
            service: option.name || option.service_name || 'Serviço',
            price: parseFloat(option.price),
            deadline: parseInt(option.delivery_time),
            company: option.company?.name || option.company || 'Transportadora'
          });
        }
      });
    } else if (shippingData && typeof shippingData === 'object') {
      if (shippingData.services && Array.isArray(shippingData.services)) {
        shippingData.services.forEach((option: any) => {
          if (option.price && option.delivery_time) {
            quotes.push({
              service: option.name || option.service_name || 'Serviço',
              price: parseFloat(option.price),
              deadline: parseInt(option.delivery_time),
              company: option.company?.name || option.company || 'Transportadora'
            });
          }
        });
      }
    }

    console.log('Final processed quotes:', quotes);

    if (quotes.length === 0) {
      console.log('No valid quotes found, returning fallback data');
      const fallbackQuotes: ShippingQuote[] = [
        {
          service: 'PAC (No Quotes)',
          price: 15.90,
          deadline: 8,
          company: 'Correios'
        },
        {
          service: 'SEDEX (No Quotes)',
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
            message: 'No valid quotes found in API response'
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
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
