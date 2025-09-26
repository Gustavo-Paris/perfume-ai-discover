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

    if (!shipment.pdf_url) {
      throw new Error('Label PDF not available for this shipment');
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

    const melhorEnvioToken = Deno.env.get('MELHOR_ENVIO_TOKEN');
    if (!melhorEnvioToken) {
      throw new Error('Melhor Envio token not configured');
    }

    // Get shipment ID for API call - prefer melhor_envio_shipment_id over cart_id
    const shipmentId = shipment.melhor_envio_shipment_id || shipment.melhor_envio_cart_id;
    if (!shipmentId) {
      throw new Error('ID de envio do Melhor Envio não encontrado');
    }

    // Use the correct API endpoint to download PDF directly
    const melhorEnvioUrl = Deno.env.get('MELHOR_ENVIO_ENVIRONMENT') === 'production' 
      ? `https://melhorenvio.com.br/api/v2/me/shipment/${shipmentId}/print/pdf`
      : `https://sandbox.melhorenvio.com.br/api/v2/me/shipment/${shipmentId}/print/pdf`;

    console.log('Using API endpoint for label download:', melhorEnvioUrl);

    // Download label using API endpoint
    const labelResponse = await fetch(melhorEnvioUrl, {
      headers: {
        'Accept': 'application/pdf',
        'Authorization': `Bearer ${melhorEnvioToken}`,
        'User-Agent': 'Aplicacao loja@email.com.br'
      }
    });

    if (!labelResponse.ok) {
      console.error('Label response error:', labelResponse.status, labelResponse.statusText);
      const responseText = await labelResponse.text();
      console.error('Response body:', responseText.substring(0, 500));
      
      if (labelResponse.status === 404) {
        throw new Error('Etiqueta não encontrada. A URL pode ter expirado.');
      } else if (labelResponse.status === 401) {
        throw new Error('Não autorizado. Verifique o token do Melhor Envio.');
      } else {
        throw new Error(`Erro ao baixar etiqueta: ${labelResponse.status} ${labelResponse.statusText}`);
      }
    }

    // Check content type and handle HTML responses
    const contentType = labelResponse.headers.get('content-type');
    console.log('Content type received:', contentType);
    
    // If we get HTML, it might be a login page or error page
    if (contentType && contentType.includes('text/html')) {
      const responseText = await labelResponse.text();
      
      // Check if it's actually a PDF disguised as HTML
      if (responseText.startsWith('%PDF-')) {
        console.log('PDF content found despite HTML content-type');
        // Convert string back to binary
        const labelData = new Uint8Array(responseText.split('').map(char => char.charCodeAt(0)));
        
        // Cache and return the label
        const labelFileName = `labels/${shipment.id}.pdf`;
        try {
          await supabase.storage
            .from('shipment-labels')
            .upload(labelFileName, labelData, {
              contentType: 'application/pdf',
              upsert: true
            });
        } catch (cacheError) {
          console.warn('Error caching label:', cacheError);
        }

        await supabase
          .from('shipments')
          .update({ 
            label_downloaded_at: new Date().toISOString(),
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
      } else {
        console.error('Received HTML instead of PDF - URL may be invalid');
        console.error('HTML content preview:', responseText.substring(0, 200));
        throw new Error('A URL da etiqueta retornou uma página web ao invés do PDF. Tente gerar uma nova etiqueta.');
      }
    }

    const labelArrayBuffer = await labelResponse.arrayBuffer();
    if (!labelArrayBuffer || labelArrayBuffer.byteLength === 0) {
      throw new Error('Empty response from Melhor Envio');
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