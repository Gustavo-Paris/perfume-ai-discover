import { useEffect } from 'react';
import { useRateLimit } from '@/hooks/useRateLimit';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface CheckoutRateLimitGuardProps {
  onBlocked?: () => void;
  children: React.ReactNode;
}

export const CheckoutRateLimitGuard = ({ 
  onBlocked, 
  children 
}: CheckoutRateLimitGuardProps) => {
  const { isBlocked, remainingAttempts, getBlockedMessage } = useRateLimit('checkout', {
    maxAttempts: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes
    blockDuration: 10 * 60 * 1000 // 10 minutes
  });

  useEffect(() => {
    if (isBlocked && onBlocked) {
      onBlocked();
    }
  }, [isBlocked, onBlocked]);

  if (isBlocked) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {getBlockedMessage()}. Por segurança, aguarde antes de tentar novamente.
        </AlertDescription>
      </Alert>
    );
  }

  if (remainingAttempts <= 1) {
    return (
      <>
        <Alert variant="default" className="my-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            Atenção: Esta é sua última tentativa de checkout antes de ser temporariamente bloqueado.
          </AlertDescription>
        </Alert>
        {children}
      </>
    );
  }

  return <>{children}</>;
};
