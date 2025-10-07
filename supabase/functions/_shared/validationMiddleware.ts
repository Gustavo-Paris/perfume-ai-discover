/**
 * FASE 4: Middleware de validação para Edge Functions
 * Fornece validação robusta e consistente em todas as edge functions
 */

import { validateCSRFToken, checkRateLimit, logSecurityEvent, getClientIP } from "./security.ts";

export interface ValidationOptions {
  requireAuth?: boolean;
  requireCSRF?: boolean;
  rateLimit?: {
    maxAttempts: number;
    windowMinutes: number;
  };
  allowedOrigins?: string[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  statusCode?: number;
  user?: any;
  clientIP?: string | null;
}

/**
 * Middleware de validação para edge functions
 * Valida autenticação, CSRF, rate limiting e origem
 */
export const validateRequest = async (
  req: Request,
  supabase: any,
  options: ValidationOptions = {}
): Promise<ValidationResult> => {
  const {
    requireAuth = false,
    requireCSRF = false,
    rateLimit,
    allowedOrigins,
  } = options;

  const clientIP = getClientIP(req);

  // 1. Validar origem se especificado
  if (allowedOrigins && allowedOrigins.length > 0) {
    const origin = req.headers.get('origin');
    if (!origin || !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      console.warn('[SECURITY] Invalid origin:', origin);
      await logSecurityEvent(
        supabase,
        null,
        'invalid_origin',
        'Origem inválida detectada',
        'high',
        { origin, ip: clientIP }
      );
      
      return {
        valid: false,
        error: 'Origem não autorizada',
        statusCode: 403,
      };
    }
  }

  // 2. Validar autenticação se requerida
  let user = null;
  if (requireAuth) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return {
        valid: false,
        error: 'Autenticação necessária',
        statusCode: 401,
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.warn('[SECURITY] Authentication failed:', error?.message);
      await logSecurityEvent(
        supabase,
        null,
        'auth_failed',
        'Falha na autenticação',
        'medium',
        { error: error?.message, ip: clientIP }
      );
      
      return {
        valid: false,
        error: 'Token de autenticação inválido',
        statusCode: 401,
      };
    }
    
    user = data.user;
  } else {
    // Tentar pegar usuário mesmo que não seja obrigatório
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data } = await supabase.auth.getUser(token);
      user = data?.user || null;
    }
  }

  // 3. Validar CSRF token se requerido
  if (requireCSRF) {
    let csrfToken: string | undefined;
    
    try {
      const body = await req.clone().json();
      csrfToken = body.csrfToken;
    } catch (error) {
      console.warn('[SECURITY] Failed to parse request body for CSRF');
    }

    if (!validateCSRFToken(csrfToken)) {
      console.warn('[SECURITY] CSRF validation failed');
      await logSecurityEvent(
        supabase,
        user?.id || null,
        'csrf_validation_failed',
        'Token CSRF inválido',
        'high',
        { ip: clientIP }
      );
      
      return {
        valid: false,
        error: 'Token de segurança inválido. Recarregue a página.',
        statusCode: 403,
      };
    }
  }

  // 4. Verificar rate limiting se especificado
  if (rateLimit) {
    const { maxAttempts, windowMinutes } = rateLimit;
    const endpoint = new URL(req.url).pathname;
    
    const rateLimitResult = await checkRateLimit(
      supabase,
      user?.id || null,
      clientIP,
      endpoint,
      maxAttempts,
      windowMinutes
    );

    if (!rateLimitResult.allowed) {
      console.warn('[SECURITY] Rate limit exceeded:', { userId: user?.id, ip: clientIP });
      await logSecurityEvent(
        supabase,
        user?.id || null,
        'rate_limit_exceeded',
        'Rate limit excedido',
        'medium',
        { endpoint, ip: clientIP }
      );
      
      return {
        valid: false,
        error: 'Muitas tentativas. Tente novamente em alguns minutos.',
        statusCode: 429,
      };
    }
  }

  // Validação passou
  return {
    valid: true,
    user,
    clientIP,
  };
};

/**
 * Helper para criar resposta de erro padronizada
 */
export const createErrorResponse = (
  error: string,
  statusCode: number = 400,
  corsHeaders: Record<string, string> = {}
): Response => {
  return new Response(
    JSON.stringify({ 
      success: false,
      error 
    }),
    {
      status: statusCode,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    }
  );
};

/**
 * Helper para criar resposta de sucesso padronizada
 */
export const createSuccessResponse = (
  data: any,
  corsHeaders: Record<string, string> = {}
): Response => {
  return new Response(
    JSON.stringify({ 
      success: true,
      ...data 
    }),
    {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    }
  );
};

/**
 * Validar schema de dados com Zod-like validation
 */
export const validateData = <T>(
  data: any,
  validators: Record<keyof T, (value: any) => boolean | string>
): { valid: true; data: T } | { valid: false; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  const validatedData: any = {};

  for (const [field, validator] of Object.entries(validators)) {
    const value = data[field];
    const result = validator(value);
    
    if (result === true) {
      validatedData[field] = value;
    } else if (typeof result === 'string') {
      errors[field] = result;
    } else {
      errors[field] = `Campo inválido: ${field}`;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: validatedData as T };
};
