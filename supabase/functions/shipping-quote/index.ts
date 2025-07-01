
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MELHOR_ENVIO_API = 'https://sandbox.melhorenvio.com.br/api/v2/me';
const MELHOR_ENVIO_AUTH_URL = 'https://sandbox.melhorenvio.com.br/oauth/token';

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

    // Get Melhor Envio credentials
    const melhorEnvioToken = Deno.env.get('MELHOR_ENVIO_TOKEN');
    const melhorEnvioClientId = Deno.env.get('MELHOR_ENVIO_CLIENT_ID');
    const melhorEnvioClientSecret = Deno.env.get('MELHOR_ENVIO_CLIENT_SECRET');
    
    console.log('=== MELHOR ENVIO CREDENTIALS CHECK ===');
    console.log('Token exists:', !!melhorEnvioToken);
    console.log('Client ID exists:', !!melhorEnvioClientId);
    console.log('Client Secret exists:', !!melhorEnvioClientSecret);
    
    if (!melhorEnvioToken || !melhorEnvioClientId || !melhorEnvioClientSecret) {
      console.log('Missing Melhor Envio credentials - using mock data');
      
      const mockQuotes: ShippingQuote[] = [
        {
          service: 'PAC (Credenciais Incompletas)',
          price: 15.90,
          deadline: 8,
          company: 'Correios'
        },
        {
          service: 'SEDEX (Credenciais Incompletas)',
          price: 25.50,
          deadline: 3,
          company: 'Correios'
        }
      ];

      return new Response(
        JSON.stringify({ 
          quotes: mockQuotes,
          debug: {
            message: 'Credenciais incompletas do Melhor Envio',
            missing: {
              token: !melhorEnvioToken,
              clientId: !melhorEnvioClientId,
              clientSecret: !melhorEnvioClientSecret
            }
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate access token using client credentials
    console.log('=== GENERATING ACCESS TOKEN ===');
    
    const tokenResponse = await fetch(MELHOR_ENVIO_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Aplicação teste@exemplo.com'
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: melhorEnvioClientId,
        client_secret: melhorEnvioClientSecret,
        scope: ''
      })
    });

    console.log('Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error('Token generation failed:', tokenError);
      
      const fallbackQuotes: ShippingQuote[] = [
        {
          service: 'PAC (Erro na Autenticação)',
          price: 15.90,
          deadline: 8,
          company: 'Correios'
        },
        {
          service: 'SEDEX (Erro na Autenticação)',
          price: 25.50,
          deadline: 3,
          company: 'Correios'
        }
      ];

      return new Response(
        JSON.stringify({ 
          quotes: fallbackQuotes,
          debug: {
            error: `Token generation failed: ${tokenResponse.status}`,
            message: tokenError
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    console.log('Access token generated successfully');

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

    // Call Melhor Envio API for shipping calculation
    const response = await fetch(`${MELHOR_ENVIO_API}/shipment/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
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
          service: 'PAC (Erro no Cálculo)',
          price: 15.90,
          deadline: 8,
          company: 'Correios'
        },
        {
          service: 'SEDEX (Erro no Cálculo)',
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
          service: 'PAC (Sem Cotações)',
          price: 15.90,
          deadline: 8,
          company: 'Correios'
        },
        {
          service: 'SEDEX (Sem Cotações)',
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
