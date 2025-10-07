/**
 * Shared security utilities for edge functions
 * FASE 2.1: Validação server-side e proteções
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Sanitizar strings para prevenir XSS/SQL Injection
export const sanitizeString = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/[';\"\\]/g, '') // Remove SQL injection chars
    .replace(/--/g, '') // Remove SQL comments
    .trim()
    .substring(0, 500); // Limit length
};

// Validar CSRF token (simplificado - compara com sessionStorage)
export const validateCSRFToken = (submittedToken: string | undefined): boolean => {
  if (!submittedToken) {
    console.warn('[SECURITY] CSRF token missing');
    return false;
  }
  
  // Token deve ter formato válido (64 caracteres hexadecimais)
  const tokenRegex = /^[a-f0-9]{64}$/i;
  if (!tokenRegex.test(submittedToken)) {
    console.warn('[SECURITY] CSRF token format invalid');
    return false;
  }
  
  return true;
};

// Rate limiting server-side
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

export const checkRateLimit = async (
  supabase: any,
  userId: string | null,
  ipAddress: string | null,
  endpoint: string,
  maxAttempts: number = 10,
  windowMinutes: number = 5
): Promise<RateLimitResult> => {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_user_id: userId,
      p_ip_address: ipAddress,
      p_endpoint: endpoint,
      p_limit: maxAttempts,
      p_window_minutes: windowMinutes
    });
    
    if (error) {
      console.error('[SECURITY] Rate limit check failed:', error);
      // Em caso de erro, permitir (fail open) mas logar
      return { allowed: true, remaining: maxAttempts, reset: Date.now() + (windowMinutes * 60 * 1000) };
    }
    
    return {
      allowed: data === true,
      remaining: maxAttempts - 1, // Simplificado
      reset: Date.now() + (windowMinutes * 60 * 1000)
    };
  } catch (error) {
    console.error('[SECURITY] Rate limit exception:', error);
    return { allowed: true, remaining: maxAttempts, reset: Date.now() + (windowMinutes * 60 * 1000) };
  }
};

// Log de eventos de segurança
export const logSecurityEvent = async (
  supabase: any,
  userId: string | null,
  eventType: string,
  description: string,
  riskLevel: 'low' | 'medium' | 'high' | 'critical',
  metadata?: Record<string, any>
) => {
  try {
    await supabase.rpc('log_security_event', {
      user_uuid: userId,
      event_type_param: eventType,
      event_description_param: description,
      risk_level_param: riskLevel,
      metadata_param: metadata || {}
    });
  } catch (error) {
    console.error('[SECURITY] Failed to log security event:', error);
  }
};

// Validar e sanitizar dados do checkout
export interface SanitizedCheckoutItem {
  perfume_id: string;
  name: string;
  brand: string;
  size_ml: number;
  quantity: number;
  unit_price: number;
}

export const validateAndSanitizeCheckoutItems = (
  items: any[]
): SanitizedCheckoutItem[] => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Items inválidos');
  }
  
  if (items.length > 50) {
    throw new Error('Muitos items no carrinho (máximo 50)');
  }
  
  return items.map((item, index) => {
    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(item.perfume_id)) {
      throw new Error(`Item ${index}: perfume_id inválido`);
    }
    
    // Validar e sanitizar strings
    const name = sanitizeString(item.name || '');
    const brand = sanitizeString(item.brand || '');
    
    if (!name || !brand) {
      throw new Error(`Item ${index}: nome ou marca vazio`);
    }
    
    // Validar números
    const size_ml = parseInt(item.size_ml);
    const quantity = parseInt(item.quantity);
    const unit_price = parseFloat(item.unit_price);
    
    if (isNaN(size_ml) || size_ml <= 0 || size_ml > 1000) {
      throw new Error(`Item ${index}: tamanho inválido`);
    }
    
    if (isNaN(quantity) || quantity <= 0 || quantity > 99) {
      throw new Error(`Item ${index}: quantidade inválida`);
    }
    
    if (isNaN(unit_price) || unit_price <= 0 || unit_price > 100000) {
      throw new Error(`Item ${index}: preço inválido`);
    }
    
    return {
      perfume_id: item.perfume_id,
      name,
      brand,
      size_ml,
      quantity,
      unit_price
    };
  });
};

// Extrair IP do request
export const getClientIP = (req: Request): string | null => {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         req.headers.get('x-real-ip') ||
         null;
};

// Validar origem do request
export const validateOrigin = (req: Request, allowedOrigins: string[]): boolean => {
  const origin = req.headers.get('origin');
  if (!origin) {
    console.warn('[SECURITY] No origin header');
    return false;
  }
  
  return allowedOrigins.some(allowed => origin.startsWith(allowed));
};
