import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RetryRequest {
  order_id: string;
}

serve(async (req: Request) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] ========== NFE RETRY START ==========`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] Missing environment variables`);
      throw new Error('Missing Supabase environment variables');
    }

    console.log(`[${requestId}] Initializing Supabase client`);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { order_id }: RetryRequest = await req.json();
    console.log(`[${requestId}] Retry request for order_id:`, order_id);
    
    if (!order_id) {
      console.error(`[${requestId}] Missing order_id in request`);
      throw new Error('order_id is required');
    }

    // Check if NFe already exists
    console.log(`[${requestId}] Checking for existing NFe`);
    const { data: existingNfe, error: checkError } = await supabase
      .from('fiscal_notes')
      .select('id, nfe_number, status')
      .eq('order_id', order_id)
      .maybeSingle();

    if (checkError) {
      console.error(`[${requestId}] Error checking existing NFe:`, checkError);
    }

    if (existingNfe) {
      console.warn(`[${requestId}] NFe already exists:`, {
        nfe_id: existingNfe.id,
        nfe_number: existingNfe.nfe_number,
        status: existingNfe.status
      });
      console.log(`[${requestId}] Proceeding with retry (will regenerate)`);
    }

    // Call the generate-nfe function
    console.log(`[${requestId}] Invoking generate-nfe function`);
    const startTime = Date.now();
    const { data, error } = await supabase.functions.invoke('generate-nfe', {
      body: { order_id }
    });
    const duration = Date.now() - startTime;

    if (error) {
      console.error(`[${requestId}] ❌ NFe generation failed after ${duration}ms:`, error);
      console.log(`[${requestId}] ========== NFE RETRY END (ERROR) ==========`);
      return new Response(
        JSON.stringify({ 
          success: false,
          request_id: requestId,
          duration_ms: duration,
          error: error.message || 'Failed to generate NF-e' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[${requestId}] ✅ NFe generated successfully in ${duration}ms`);
    console.log(`[${requestId}] Response data:`, data);
    console.log(`[${requestId}] ========== NFE RETRY END ==========`);

    return new Response(
      JSON.stringify({ 
        success: true,
        request_id: requestId,
        duration_ms: duration,
        message: 'NFe generation retried successfully',
        data 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error(`[${requestId}] ❌ FATAL ERROR in NFe retry:`, error);
    console.error(`[${requestId}] Error details:`, {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown'
    });
    console.log(`[${requestId}] ========== NFE RETRY END (ERROR) ==========`);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        request_id: requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        error_type: error instanceof Error ? error.name : 'Unknown',
        details: 'Check function logs for more information'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});