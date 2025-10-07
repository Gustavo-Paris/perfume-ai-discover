import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Componente visual para monitorar sessão
 * Mostra alertas quando a sessão está próxima de expirar
 */
export const SessionMonitor = () => {
  const { session } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!session?.expires_at) {
      setShowWarning(false);
      return;
    }

    const checkExpiry = () => {
      const expiresAt = session.expires_at! * 1000;
      const now = Date.now();
      const remaining = expiresAt - now;

      // Mostrar warning se faltam menos de 10 minutos
      if (remaining > 0 && remaining <= 10 * 60 * 1000) {
        setShowWarning(true);
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setShowWarning(false);
      }
    };

    // Verificar imediatamente
    checkExpiry();

    // Atualizar a cada segundo
    const interval = setInterval(checkExpiry, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const handleStayLoggedIn = () => {
    // Qualquer atividade resetará o timer de auto-logout
    // Apenas fechar o alerta já é suficiente
    setShowWarning(false);
  };

  if (!showWarning) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert variant="default" className="bg-yellow-50 border-yellow-200">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="font-medium text-yellow-800">Sua sessão expira em breve</p>
            <p className="text-sm text-yellow-700 mt-1">
              Tempo restante: <Clock className="inline h-3 w-3" /> {timeRemaining}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleStayLoggedIn}
            className="bg-white hover:bg-yellow-100"
          >
            Continuar
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};
