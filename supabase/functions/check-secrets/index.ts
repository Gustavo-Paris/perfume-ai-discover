import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lista de secrets que queremos verificar
const SECRETS_TO_CHECK = [
  'MODO_BANK_PUBLIC_KEY',
  'MODO_BANK_SECRET_KEY', 
  'MELHOR_ENVIO_TOKEN',
  'MELHOR_ENVIO_CLIENT_ID',
  'MELHOR_ENVIO_CLIENT_SECRET',
  'OPENAI_API_KEY',
  'ALGOLIA_APP_ID',
  'ALGOLIA_SEARCH_KEY',
  'ALGOLIA_ADMIN_KEY',
  'RESEND_API_KEY',
  'GA_MEASUREMENT_ID',
  'SENTRY_DSN'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Checking secrets status...');
    
    // Verificar quais secrets estão configurados
    const secretsStatus: Record<string, 'configured' | 'missing'> = {};
    
    for (const secretName of SECRETS_TO_CHECK) {
      try {
        const secretValue = Deno.env.get(secretName);
        
        // Consideramos configurado se existe e não está vazio
        if (secretValue && secretValue.trim() !== '') {
          secretsStatus[secretName] = 'configured';
          console.log(`✅ ${secretName}: configured`);
        } else {
          secretsStatus[secretName] = 'missing';
          console.log(`❌ ${secretName}: missing`);
        }
      } catch (error) {
        console.error(`Error checking ${secretName}:`, error);
        secretsStatus[secretName] = 'missing';
      }
    }

    // Estatísticas resumidas
    const configuredCount = Object.values(secretsStatus).filter(status => status === 'configured').length;
    const totalCount = SECRETS_TO_CHECK.length;
    
    const result = {
      secrets: secretsStatus,
      summary: {
        configured: configuredCount,
        missing: totalCount - configuredCount,
        total: totalCount,
        percentage: Math.round((configuredCount / totalCount) * 100)
      },
      lastChecked: new Date().toISOString()
    };

    console.log('Secrets check completed:', result.summary);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in check-secrets function:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Erro ao verificar status dos secrets',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});