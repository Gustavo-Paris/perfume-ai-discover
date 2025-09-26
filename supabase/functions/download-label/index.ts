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

    // Validate PDF URL format
    if (!shipment.pdf_url || (!shipment.pdf_url.includes('/print') && !shipment.pdf_url.includes('/imprimir'))) {
      console.error('Invalid PDF URL format:', shipment.pdf_url);
      throw new Error('URL de etiqueta inválida. Pode ser necessário gerar uma nova etiqueta.');
    }

    // Download label from Melhor Envio
    console.log('Downloading label from Melhor Envio:', shipment.pdf_url);
    
    const melhorEnvioToken = Deno.env.get('MELHOR_ENVIO_TOKEN');
    if (!melhorEnvioToken) {
      throw new Error('Melhor Envio token not configured');
    }

    // Try different approaches for downloading the label
    let labelResponse;
    
    // First try: Direct URL with token
    labelResponse = await fetch(shipment.pdf_url, {
      headers: {
        'Authorization': `Bearer ${melhorEnvioToken}`,
        'Accept': 'application/pdf',
        'User-Agent': 'Aplicacao loja@email.com.br'
      }
    });

    // If first attempt fails, try without authorization header (some URLs are public)
    if (!labelResponse.ok && labelResponse.status === 401) {
      console.log('Trying without authorization header...');
      labelResponse = await fetch(shipment.pdf_url, {
        headers: {
          'Accept': 'application/pdf',
          'User-Agent': 'Aplicacao loja@email.com.br'
        }
      });
    }

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

    // Check content type
    const contentType = labelResponse.headers.get('content-type');
    console.log('Content type received:', contentType);
    
    if (contentType && contentType.includes('text/html')) {
      console.error('Received HTML instead of PDF - URL may be invalid');
      throw new Error('A URL da etiqueta está inválida. Tente gerar uma nova etiqueta.');
    }
    
    if (contentType && !contentType.includes('application/pdf') && !contentType.includes('application/octet-stream')) {
      console.error('Invalid content type received:', contentType);
      throw new Error('Formato de arquivo inválido recebido do Melhor Envio');
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