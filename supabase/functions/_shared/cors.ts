/**
 * Secure CORS configuration for edge functions
 * Replaces wildcard CORS with origin validation
 */

// Production domains
const PRODUCTION_ORIGINS = [
  'https://parisandco.com.br',
  'https://www.parisandco.com.br',
];

// Development origins
const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

// Supabase preview/staging origins (automatically allowed)
const SUPABASE_PREVIEW_PATTERN = /^https:\/\/([a-z0-9-]+)\.supabase\.co$/;
const LOVABLE_PREVIEW_PATTERN = /^https:\/\/([a-z0-9-]+)\.lovableproject\.com$/;

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  // Allow production origins
  if (PRODUCTION_ORIGINS.includes(origin)) return true;

  // Allow development origins (only in non-production)
  const isDev = Deno.env.get('ENVIRONMENT') !== 'production';
  if (isDev && DEV_ORIGINS.includes(origin)) return true;

  // Allow Supabase and Lovable preview URLs
  if (SUPABASE_PREVIEW_PATTERN.test(origin)) return true;
  if (LOVABLE_PREVIEW_PATTERN.test(origin)) return true;

  return false;
}

/**
 * Get secure CORS headers for a request
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  
  // If origin is allowed, reflect it back
  // Otherwise, use the first production origin as fallback
  const allowedOrigin = origin && isOriginAllowed(origin) 
    ? origin 
    : PRODUCTION_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Get CORS headers for OPTIONS preflight requests
 */
export function getPreflightHeaders(req: Request): Record<string, string> {
  return {
    ...getCorsHeaders(req),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}

/**
 * Handle OPTIONS preflight request
 */
export function handleCorsPreflightRequest(req: Request): Response {
  return new Response(null, {
    status: 204,
    headers: getPreflightHeaders(req),
  });
}
