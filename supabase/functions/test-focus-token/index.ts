import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const homologToken = Deno.env.get('FOCUS_NFE_HOMOLOG_TOKEN');
    const prodToken = Deno.env.get('FOCUS_NFE_TOKEN');
    
    // Only log in development
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log('Token debug:', {
        hasHomologToken: !!homologToken,
        hasProdToken: !!prodToken,
        homologTokenLength: homologToken?.length || 0,
        prodTokenLength: prodToken?.length || 0
      });
    }

    // Test Focus NFe API connection
    if (homologToken) {
      const testResponse = await fetch('https://homologacao.focusnfe.com.br/v2/empresa', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(homologToken + ':')}`
        }
      });
      
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log('Focus NFe test response:', {
          status: testResponse.status,
          statusText: testResponse.statusText
        });
      }
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        if (Deno.env.get('ENVIRONMENT') === 'development') {
          console.log('Focus NFe error:', errorText);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        hasHomologToken: !!homologToken,
        hasProdToken: !!prodToken,
        message: 'Token check completed - see logs for details'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error testing token:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});