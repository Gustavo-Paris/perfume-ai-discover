
import { useState, useEffect } from 'react';
import { Copy, Check, Clock, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface PixPaymentProps {
  qrCode: string;
  qrCodeUrl: string;
  expiresAt: string;
  onSuccess: () => void;
}

export const PixPayment = ({ qrCode, qrCodeUrl, expiresAt, onSuccess }: PixPaymentProps) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft('Expirado');
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast({
        title: "Código PIX copiado!",
        description: "Cole no seu app de pagamentos para finalizar.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o código.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-playfair flex items-center justify-center">
          <QrCode className="mr-2 h-5 w-5" />
          Pagamento PIX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timer */}
        <div className="flex items-center justify-center p-4 bg-orange-50 rounded-lg">
          <Clock className="mr-2 h-4 w-4 text-orange-600" />
          <span className="font-medium text-orange-800">
            Tempo restante: {timeLeft}
          </span>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="QR Code PIX"
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded">
                <QrCode className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <h3 className="font-medium text-center">Como pagar:</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex">
              <span className="font-medium mr-2">1.</span>
              Abra o app do seu banco ou carteira digital
            </li>
            <li className="flex">
              <span className="font-medium mr-2">2.</span>
              Escaneie o QR Code ou cole o código PIX
            </li>
            <li className="flex">
              <span className="font-medium mr-2">3.</span>
              Confirme o pagamento no seu app
            </li>
            <li className="flex">
              <span className="font-medium mr-2">4.</span>
              Aguarde a confirmação automática
            </li>
          </ol>
        </div>

        {/* PIX Code */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Código PIX (Copia e Cola):</Label>
          <div className="flex space-x-2">
            <div className="flex-1 p-3 bg-gray-50 rounded border text-xs font-mono break-all">
              {qrCode}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex-shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Status Check */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Após realizar o pagamento, aguarde alguns segundos para a confirmação automática.
          </p>
          <Button variant="outline" onClick={onSuccess}>
            Verificar Status do Pagamento
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
