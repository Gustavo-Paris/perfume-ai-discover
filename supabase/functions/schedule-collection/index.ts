import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduleCollectionRequest {
  shipment_ids: string[];
  collection_date: string; // YYYY-MM-DD
  collection_time_start?: string; // HH:MM
  collection_time_end?: string; // HH:MM
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shipment_ids, collection_date, collection_time_start, collection_time_end }: ScheduleCollectionRequest = await req.json();
    
    console.log('Scheduling collection for shipments:', shipment_ids);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get shipment details
    const { data: shipments, error: shipmentsError } = await supabase
      .from('shipments')
      .select('*')
      .in('id', shipment_ids)
      .not('melhor_envio_cart_id', 'is', null);

    if (shipmentsError || !shipments?.length) {
      throw new Error('Shipments not found or invalid');
    }

    // Get Melhor Envio token
    const melhorEnvioToken = Deno.env.get('MELHOR_ENVIO_TOKEN');
    if (!melhorEnvioToken) {
      throw new Error('Melhor Envio token not configured');
    }

    // Use cart IDs for collection request (this is the correct approach)
    const cartIds = shipments
      .map(s => s.melhor_envio_cart_id)
      .filter(Boolean);

    if (!cartIds.length) {
      throw new Error('Nenhum ID de carrinho válido encontrado nos pedidos selecionados');
    }

    // Prepare collection request data
    const collectionData = {
      orders: cartIds,
      date: collection_date,
      ...(collection_time_start && { time_start: collection_time_start }),
      ...(collection_time_end && { time_end: collection_time_end })
    };

    console.log('Scheduling collection with Melhor Envio:', JSON.stringify(collectionData, null, 2));

    // Call Melhor Envio API - correct endpoint for collection requests
    const melhorEnvioUrl = Deno.env.get('MELHOR_ENVIO_ENVIRONMENT') === 'production' 
      ? 'https://melhorenvio.com.br/api/v2/me/cart/request-collect'
      : 'https://sandbox.melhorenvio.com.br/api/v2/me/cart/request-collect';

    console.log('Using collection endpoint:', melhorEnvioUrl);

    const response = await fetch(melhorEnvioUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${melhorEnvioToken}`,
        'User-Agent': 'Aplicacao loja@email.com.br'
      },
      body: JSON.stringify(collectionData)
    });

    const result = await response.json();
    console.log('Melhor Envio collection response:', result);

    if (!response.ok) {
      throw new Error(`Melhor Envio API error: ${result.message || 'Unknown error'}`);
    }

    // Update shipment records with collection information
    const { error: updateError } = await supabase
      .from('shipments')
      .update({
        collection_scheduled_at: new Date().toISOString(),
        collection_date: collection_date,
        updated_at: new Date().toISOString()
      })
      .in('id', shipment_ids);

    if (updateError) {
      console.error('Error updating shipments with collection info:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        collection_scheduled: result,
        shipments_updated: shipment_ids
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error scheduling collection:', error);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});