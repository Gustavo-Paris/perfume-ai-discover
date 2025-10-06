import { useState, useCallback, useRef } from 'react';
import { rateLimiter } from '@/utils/securityEnhancements';

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDuration?: number;
}

interface RateLimitState {
  isBlocked: boolean;
  remainingAttempts: number;
  resetTime: number | null;
}

export const useRateLimit = (key: string, config: RateLimitConfig) => {
  const [state, setState] = useState<RateLimitState>({
    isBlocked: false,
    remainingAttempts: config.maxAttempts,
    resetTime: null
  });

  const blockTimeoutRef = useRef<NodeJS.Timeout>();

  const checkLimit = useCallback((): boolean => {
    if (state.isBlocked) {
      return false;
    }

    const allowed = rateLimiter.isAllowed(key, config.maxAttempts, config.windowMs);

    if (!allowed) {
      const blockDuration = config.blockDuration || config.windowMs;
      const resetTime = Date.now() + blockDuration;

      setState({
        isBlocked: true,
        remainingAttempts: 0,
        resetTime
      });

      // Auto-reset after block duration
      if (blockTimeoutRef.current) {
        clearTimeout(blockTimeoutRef.current);
      }

      blockTimeoutRef.current = setTimeout(() => {
        rateLimiter.reset(key);
        setState({
          isBlocked: false,
          remainingAttempts: config.maxAttempts,
          resetTime: null
        });
      }, blockDuration);

      return false;
    }

    return true;
  }, [key, config, state.isBlocked]);

  const reset = useCallback(() => {
    if (blockTimeoutRef.current) {
      clearTimeout(blockTimeoutRef.current);
    }
    rateLimiter.reset(key);
    setState({
      isBlocked: false,
      remainingAttempts: config.maxAttempts,
      resetTime: null
    });
  }, [key, config.maxAttempts]);

  const getBlockedMessage = useCallback((): string => {
    if (!state.isBlocked || !state.resetTime) {
      return '';
    }

    const remainingMs = state.resetTime - Date.now();
    const remainingMinutes = Math.ceil(remainingMs / 60000);

    if (remainingMinutes > 60) {
      const hours = Math.ceil(remainingMinutes / 60);
      return `Muitas tentativas. Tente novamente em ${hours}h`;
    }

    return `Muitas tentativas. Tente novamente em ${remainingMinutes} minuto${remainingMinutes > 1 ? 's' : ''}`;
  }, [state.isBlocked, state.resetTime]);

  return {
    checkLimit,
    reset,
    isBlocked: state.isBlocked,
    remainingAttempts: state.remainingAttempts,
    getBlockedMessage
  };
};
