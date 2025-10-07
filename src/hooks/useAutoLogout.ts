import { useEffect, useRef, useCallback } from 'react';
import { logSecurityEvent } from '@/utils/securityEnhancements';

interface AutoLogoutOptions {
  inactivityTimeout: number; // em milissegundos
  warningTime: number; // tempo antes do logout para mostrar warning
  onWarning?: () => void;
  onLogout: () => void;
}

/**
 * Hook para detectar inatividade e fazer auto-logout
 * Protege contra uso não autorizado em dispositivos compartilhados
 */
export const useAutoLogout = ({
  inactivityTimeout = 30 * 60 * 1000, // 30 minutos padrão
  warningTime = 2 * 60 * 1000, // 2 minutos de aviso
  onWarning,
  onLogout,
}: AutoLogoutOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  // Resetar timer de inatividade
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Limpar timers existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Timer de warning (opcional)
    if (onWarning && warningTime > 0) {
      warningTimeoutRef.current = setTimeout(() => {
        onWarning();
        logSecurityEvent('auto_logout_warning', {
          inactiveTime: inactivityTimeout - warningTime,
        });
      }, inactivityTimeout - warningTime);
    }

    // Timer de logout
    timeoutRef.current = setTimeout(() => {
      logSecurityEvent('auto_logout_triggered', {
        inactiveTime: inactivityTimeout,
      });
      onLogout();
    }, inactivityTimeout);
  }, [inactivityTimeout, warningTime, onWarning, onLogout]);

  // Eventos que resetam o timer
  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Handler throttled para evitar muitos resets
    let throttleTimer: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          resetTimer();
          throttleTimer = null;
        }, 1000); // Throttle de 1 segundo
      }
    };

    // Adicionar listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Iniciar timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [resetTimer]);

  // Retornar função para reset manual (útil após ações críticas)
  return {
    resetTimer,
    getLastActivity: () => lastActivityRef.current,
    getRemainingTime: () => {
      const elapsed = Date.now() - lastActivityRef.current;
      return Math.max(0, inactivityTimeout - elapsed);
    },
  };
};
