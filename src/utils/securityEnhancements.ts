// FASE 2 - Melhorias de Segurança (Aplicação)
import { supabase } from '@/integrations/supabase/client';
import { debugWarn, debugError } from './removeDebugLogsProduction';

// Rate limiting client-side
class RateLimiter {
  private attempts = new Map<string, number[]>();
  
  isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 300000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }
    
    const keyAttempts = this.attempts.get(key)!;
    
    // Remove old attempts
    const validAttempts = keyAttempts.filter(timestamp => timestamp > windowStart);
    this.attempts.set(key, validAttempts);
    
    if (validAttempts.length >= maxAttempts) {
      debugWarn(`Rate limit exceeded for key: ${key}`);
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    return true;
  }
  
  reset(key: string) {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// Enhanced password validation
export const validatePasswordSecurity = (password: string): {
  isValid: boolean;
  issues: string[];
} => {
  const issues: string[] = [];
  
  if (password.length < 8) {
    issues.push('Mínimo 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    issues.push('Deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    issues.push('Deve conter pelo menos uma letra minúscula');
  }
  
  if (!/\d/.test(password)) {
    issues.push('Deve conter pelo menos um número');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    issues.push('Deve conter pelo menos um caractere especial');
  }
  
  // Check against common passwords
  const commonPasswords = [
    'password', '123456', '123456789', '12345678', '12345',
    '1234567', '1234567890', 'qwerty', 'abc123', 'password123'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    issues.push('Senha muito comum, escolha uma mais segura');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

// Secure session management
export class SecureSessionManager {
  private static readonly SESSION_KEY = 'secure_session_data';
  private static readonly ENCRYPTION_KEY = 'app_session_encryption';
  
  static storeSecureData(key: string, data: any) {
    try {
      const encrypted = btoa(JSON.stringify({ data, timestamp: Date.now() }));
      sessionStorage.setItem(`${this.SESSION_KEY}_${key}`, encrypted);
    } catch (error) {
      debugError('Failed to store secure session data:', error);
    }
  }
  
  static getSecureData(key: string, maxAge: number = 3600000): any | null {
    try {
      const encrypted = sessionStorage.getItem(`${this.SESSION_KEY}_${key}`);
      if (!encrypted) return null;
      
      const decrypted = JSON.parse(atob(encrypted));
      const age = Date.now() - decrypted.timestamp;
      
      if (age > maxAge) {
        this.removeSecureData(key);
        return null;
      }
      
      return decrypted.data;
    } catch (error) {
      debugError('Failed to retrieve secure session data:', error);
      return null;
    }
  }
  
  static removeSecureData(key: string) {
    sessionStorage.removeItem(`${this.SESSION_KEY}_${key}`);
  }
  
  static clearAllSecureData() {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(this.SESSION_KEY)) {
        sessionStorage.removeItem(key);
      }
    });
  }
}

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// SQL injection prevention for search queries
export const sanitizeSearchQuery = (query: string): string => {
  return query
    .replace(/[';\"\\]/g, '') // Remove SQL injection chars
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*.*?\*\//g, '') // Remove SQL block comments
    .substring(0, 100) // Limit length
    .trim();
};

// XSS prevention
export const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// CSRF protection helper
export const generateCSRFToken = (): string => {
  const array = new Uint32Array(8);
  crypto.getRandomValues(array);
  return Array.from(array, dec => dec.toString(16).padStart(8, '0')).join('');
};

// Security monitoring
export const logSecurityEvent = async (event: string, details?: any) => {
  try {
    // Log security events for monitoring
    debugWarn(`SECURITY EVENT: ${event}`, details);
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Could send to Sentry, LogRocket, etc.
      console.warn(`[SECURITY] ${event}`, details);
    }
  } catch (error) {
    debugError('Failed to log security event:', error);
  }
};