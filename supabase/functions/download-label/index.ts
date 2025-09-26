import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DownloadLabelRequest {
  shipment_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shipment_id }: DownloadLabelRequest = await req.json();
    
    console.log('Downloading label for shipment:', shipment_id);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get shipment details
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipment_id)
      .single();

    if (shipmentError || !shipment) {
      throw new Error('Shipment not found');
    }

    // Check if label is already cached in storage
    const labelFileName = `labels/${shipment.id}.pdf`;
    
    // Try to get existing label from storage
    const { data: existingFile } = await supabase.storage
      .from('shipment-labels')
      .download(labelFileName);

    if (existingFile) {
      console.log('Returning cached label');
      return new Response(existingFile, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="etiqueta-${shipment.order_id}.pdf"`
        }
      });
    }

    // Get Melhor Envio token
    const melhorEnvioToken = Deno.env.get('MELHOR_ENVIO_TOKEN');
    if (!melhorEnvioToken) {
      throw new Error('Melhor Envio token not configured');
    }

    // Use cart ID to get the order and generate/download the label
    const cartId = shipment.melhor_envio_cart_id || shipment.melhor_envio_shipment_id;
    if (!cartId) {
      throw new Error('ID de envio do Melhor Envio não encontrado');
    }

    // Use the correct GET endpoint to get the PDF directly
    const melhorEnvioUrl = Deno.env.get('MELHOR_ENVIO_ENVIRONMENT') === 'production' 
      ? `https://melhorenvio.com.br/api/v2/me/orders/${cartId}/print`
      : `https://sandbox.melhorenvio.com.br/api/v2/me/orders/${cartId}/print`;

    console.log('Getting label PDF from Melhor Envio:', melhorEnvioUrl);

    // Use GET method to download the PDF directly
    const labelResponse = await fetch(melhorEnvioUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
        'Authorization': `Bearer ${melhorEnvioToken}`,
        'User-Agent': 'Aplicacao loja@email.com.br'
      }
    });

    if (!labelResponse.ok) {
      const errorText = await labelResponse.text();
      console.error('Label download error:', labelResponse.status, errorText);
      throw new Error(`Erro ao baixar etiqueta: ${labelResponse.status} - ${errorText}`);
    }

    // Check content type to ensure we got a PDF
    const contentType = labelResponse.headers.get('content-type');
    console.log('Response content type:', contentType);
    
    if (!contentType?.includes('application/pdf')) {
      const responseText = await labelResponse.text();
      console.error('Expected PDF but got:', contentType, responseText.substring(0, 500));
      throw new Error('API não retornou um PDF válido');
    }

    const labelArrayBuffer = await labelResponse.arrayBuffer();
    if (!labelArrayBuffer || labelArrayBuffer.byteLength === 0) {
      throw new Error('Resposta vazia do Melhor Envio');
    }
    
    const labelData = new Uint8Array(labelArrayBuffer);

    // Cache the label in Supabase storage
    try {
      const { error: uploadError } = await supabase.storage
        .from('shipment-labels')
        .upload(labelFileName, labelData, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        console.warn('Failed to cache label:', uploadError);
      } else {
        console.log('Label cached successfully');
      }
    } catch (cacheError) {
      console.warn('Error caching label:', cacheError);
    }

    // Update shipment with download timestamp
    await supabase
      .from('shipments')
      .update({ 
        label_downloaded_at: new Date().toISOString(),
        pdf_url: melhorEnvioUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', shipment_id);

    return new Response(labelData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="etiqueta-${shipment.order_id}.pdf"`
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error downloading label:', error);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});