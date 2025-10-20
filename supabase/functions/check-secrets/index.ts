import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

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
  'SENTRY_DSN',
  'STRIPE_SECRET_KEY'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    console.log('=== Check Secrets Function Started ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Adicionar verificação de autenticação
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ No authorization header found');
      return new Response(JSON.stringify({ 
        error: 'Authorization required',
        details: 'No authorization header provided'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('🔍 Checking secrets status...');
    
    // Verificar quais secrets estão configurados
    const secretsStatus: Record<string, 'configured' | 'missing'> = {};
    
    console.log(`Checking ${SECRETS_TO_CHECK.length} secrets...`);
    
    for (const secretName of SECRETS_TO_CHECK) {
      try {
        const secretValue = Deno.env.get(secretName);
        
        // Consideramos configurado se existe e não está vazio
        if (secretValue && secretValue.trim() !== '') {
          secretsStatus[secretName] = 'configured';
          console.log(`✅ ${secretName}: configured (length: ${secretValue.length})`);
        } else {
          secretsStatus[secretName] = 'missing';
          console.log(`❌ ${secretName}: missing or empty`);
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('❌ Error in check-secrets function:', error);
    console.error('Error stack:', errorStack);
    
    return new Response(JSON.stringify({ 
      error: 'Erro ao verificar status dos secrets',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});