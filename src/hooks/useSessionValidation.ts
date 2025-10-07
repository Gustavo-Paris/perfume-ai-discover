import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent } from '@/utils/securityEnhancements';

interface SessionValidationOptions {
  checkInterval?: number; // Intervalo de verificação em ms
  refreshBeforeExpiry?: number; // Renovar token X ms antes de expirar
  onSessionExpired?: () => void;
  onSessionRefreshed?: () => void;
}

/**
 * Hook para validação contínua de sessão e refresh automático de tokens
 * Previne uso de tokens expirados ou roubados
 */
export const useSessionValidation = ({
  checkInterval = 60000, // Verificar a cada 1 minuto
  refreshBeforeExpiry = 5 * 60 * 1000, // Renovar 5 min antes de expirar
  onSessionExpired,
  onSessionRefreshed,
}: SessionValidationOptions = {}) => {
  const checkIntervalRef = useRef<NodeJS.Timeout>();
  const isCheckingRef = useRef(false);

  // Verificar e renovar sessão se necessário
  const validateAndRefreshSession = useCallback(async () => {
    // Prevenir múltiplas verificações simultâneas
    if (isCheckingRef.current) return;
    
    try {
      isCheckingRef.current = true;

      // Buscar sessão atual
      const { data: { session }, error } = await supabase.auth.getSession();
      
      // Se não há sessão ativa, não fazer nada (usuário não logado)
      if (!session && !error) {
        return;
      }

      if (error) {
        console.error('Session validation error:', error);
        logSecurityEvent('session_validation_error', { error: error.message });
        return;
      }

      if (!session) {
        logSecurityEvent('session_not_found');
        onSessionExpired?.();
        return;
      }

      // Verificar se o token está próximo de expirar
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      // Se está próximo de expirar, renovar
      if (timeUntilExpiry > 0 && timeUntilExpiry <= refreshBeforeExpiry) {
        console.log('Session expiring soon, refreshing token...');
        
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          console.error('Token refresh failed:', refreshError);
          logSecurityEvent('token_refresh_failed', { error: refreshError.message });
          onSessionExpired?.();
          return;
        }

        if (refreshData.session) {
          logSecurityEvent('token_refreshed', {
            expiresIn: refreshData.session.expires_at,
          });
          onSessionRefreshed?.();
        }
      }

      // Se já expirou
      if (timeUntilExpiry <= 0) {
        logSecurityEvent('session_expired', { expiredAt: new Date(expiresAt) });
        onSessionExpired?.();
      }
    } catch (error) {
      console.error('Session validation error:', error);
      logSecurityEvent('session_validation_exception', { error });
    } finally {
      isCheckingRef.current = false;
    }
  }, [refreshBeforeExpiry, onSessionExpired, onSessionRefreshed]);

  // Configurar verificação periódica
  useEffect(() => {
    // Verificação inicial
    validateAndRefreshSession();

    // Verificação periódica
    checkIntervalRef.current = setInterval(() => {
      validateAndRefreshSession();
    }, checkInterval);

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [validateAndRefreshSession, checkInterval]);

  // Verificação quando a janela fica visível novamente (útil para abas inativas)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateAndRefreshSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [validateAndRefreshSession]);

  return {
    validateSession: validateAndRefreshSession,
  };
};
