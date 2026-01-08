/**
 * FASE 4: Headers de segurança HTTP
 * Configurações de segurança para produção
 */

/**
 * Headers de segurança recomendados para aplicações web
 * 
 * IMPORTANTE: Estes headers devem ser configurados no servidor/CDN
 * (ex: Vercel, Netlify, CloudFlare) via arquivo de configuração.
 * 
 * Para Vercel: adicionar em vercel.json
 * Para Netlify: adicionar em netlify.toml ou _headers
 */

export const SECURITY_HEADERS = {
  // Previne ataques XSS
  'X-XSS-Protection': '1; mode=block',
  
  // Previne clickjacking
  'X-Frame-Options': 'DENY',
  
  // Previne MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Força HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy (antes Feature Policy)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * Content Security Policy (CSP)
 * Define de onde recursos podem ser carregados
 * 
 * ATENÇÃO: Personalizar de acordo com as necessidades do projeto
 */
export const CSP_HEADER = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net https://esm.sh",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://viacep.com.br",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; '),
};

/**
 * Gera meta tags de segurança para o HTML
 */
export const generateSecurityMetaTags = () => {
  return `
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="X-Frame-Options" content="DENY">
    <meta http-equiv="X-XSS-Protection" content="1; mode=block">
    <meta name="referrer" content="strict-origin-when-cross-origin">
  `;
};

/**
 * Configuração de CORS segura
 */
export const CORS_CONFIG = {
  // Production domains
  allowedOrigins: [
    'https://parisandco.com.br',
    'https://www.parisandco.com.br',
  ],
  
  // Development
  devOrigins: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ],
  
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Authorization',
    'Content-Type',
    'X-Client-Info',
    'apikey',
  ],
  maxAge: 86400, // 24 horas
};

/**
 * Valida se a origem é permitida
 */
export const isOriginAllowed = (origin: string | null, isDev: boolean = false): boolean => {
  if (!origin) return false;
  
  const allowed = isDev 
    ? [...CORS_CONFIG.allowedOrigins, ...CORS_CONFIG.devOrigins]
    : CORS_CONFIG.allowedOrigins;
  
  return allowed.some(allowedOrigin => origin.startsWith(allowedOrigin));
};

/**
 * Gera headers CORS
 */
export const getCorsHeaders = (origin: string | null, isDev: boolean = false): Record<string, string> => {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': CORS_CONFIG.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': CORS_CONFIG.allowedHeaders.join(', '),
    'Access-Control-Max-Age': CORS_CONFIG.maxAge.toString(),
  };
  
  // Se origem é permitida, usar ela; senão, não definir (mais seguro)
  if (origin && isOriginAllowed(origin, isDev)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  return headers;
};

/**
 * Exemplo de configuração para vercel.json
 */
export const VERCEL_CONFIG_EXAMPLE = {
  headers: [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ],
};

/**
 * Exemplo de configuração para netlify.toml
 */
export const NETLIFY_CONFIG_EXAMPLE = `
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
`;
