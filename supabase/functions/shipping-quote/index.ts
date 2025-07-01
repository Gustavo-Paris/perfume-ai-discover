
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    // Get Melhor Envio token from secrets (will be set by user)
    const melhorEnvioToken = Deno.env.get('MELHOR_ENVIO_TOKEN');
    if (!melhorEnvioToken) {
      console.error('MELHOR_ENVIO_TOKEN not found in environment');
      
      // Return mock data for demonstration
      const mockQuotes: ShippingQuote[] = [
        {
          service: 'PAC',
          price: 15.90,
          deadline: 8,
          company: 'Correios'
        },
        {
          service: 'SEDEX',
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

    // In a real implementation, you would:
    // 1. Get the order draft details from the database
    // 2. Calculate package weight and dimensions based on cart items
    // 3. Get the destination CEP from the selected address
    // 4. Make API call to Melhor Envio to get real shipping quotes

    // For now, return mock data
    const quotes: ShippingQuote[] = [
      {
        service: 'PAC',
        price: 15.90,
        deadline: 8,
        company: 'Correios'
      },
      {
        service: 'SEDEX',
        price: 25.50,
        deadline: 3,
        company: 'Correios'
      },
      {
        service: 'Jadlog',
        price: 18.75,
        deadline: 5,
        company: 'Jadlog'
      }
    ];

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
