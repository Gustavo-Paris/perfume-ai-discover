import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IntegrityCheckResult {
  integrity_issues_found: number;
  auto_fix_executed: boolean;
  auto_fix_result?: {
    fixed_count: number;
    error_count: number;
    execution_time_ms: number;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Iniciando verificação diária de integridade dos preços...');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Execute daily integrity check
    const { data, error } = await supabase.rpc('daily_price_integrity_check');

    if (error) {
      console.error('❌ Erro na verificação diária:', error);
      throw error;
    }

    const result = data as IntegrityCheckResult;
    console.log('✅ Verificação diária concluída:', result);

    // Log result for monitoring
    if (result.integrity_issues_found > 0) {
      console.log(`⚠️ ${result.integrity_issues_found} problema(s) detectado(s)`);
      
      if (result.auto_fix_executed && result.auto_fix_result) {
        console.log(`🔧 Correção automática: ${result.auto_fix_result.fixed_count} corrigido(s), ${result.auto_fix_result.error_count} erro(s)`);
      }
    } else {
      console.log('✅ Todos os preços estão corretos!');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verificação diária concluída',
        result: result
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Erro na edge function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro na verificação diária',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});