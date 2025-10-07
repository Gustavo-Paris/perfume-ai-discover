import { useState, useEffect } from 'react';
import { generateCSRFToken } from '@/utils/securityEnhancements';

interface CSRFTokenHook {
  token: string;
  refreshToken: () => void;
  validateToken: (submittedToken: string) => boolean;
}

/**
 * Hook para gerenciar tokens CSRF em formulários críticos
 * Protege contra Cross-Site Request Forgery attacks
 */
export const useCSRFToken = (): CSRFTokenHook => {
  const [token, setToken] = useState<string>('');

  // Gerar novo token no mount
  useEffect(() => {
    const newToken = generateCSRFToken();
    setToken(newToken);
    
    // Armazenar no sessionStorage para validação
    sessionStorage.setItem('csrf_token', newToken);
  }, []);

  const refreshToken = () => {
    const newToken = generateCSRFToken();
    setToken(newToken);
    sessionStorage.setItem('csrf_token', newToken);
  };

  const validateToken = (submittedToken: string): boolean => {
    const storedToken = sessionStorage.getItem('csrf_token');
    
    if (!storedToken || !submittedToken) {
      return false;
    }

    // Comparar tokens de forma segura
    return storedToken === submittedToken;
  };

  return {
    token,
    refreshToken,
    validateToken,
  };
};
