import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTwoFactor } from '@/hooks/useTwoFactor';
import { Shield, Key } from 'lucide-react';

interface TwoFactorLoginProps {
  secret: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const TwoFactorLogin = ({ secret, onSuccess, onCancel }: TwoFactorLoginProps) => {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState('');
  
  const { loading, verifyLogin, verifyBackupCode } = useTwoFactor();

  const handleVerify = async () => {
    setError('');
    
    let isValid = false;
    
    if (useBackupCode) {
      isValid = await verifyBackupCode(code);
    } else {
      isValid = await verifyLogin(code, secret);
    }

    if (isValid) {
      onSuccess();
    } else {
      setError('Código inválido. Tente novamente.');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Verificação de Dois Fatores
        </CardTitle>
        <CardDescription>
          Digite o código do seu aplicativo autenticador
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Key className="h-4 w-4" />
          <AlertDescription>
            Abra seu aplicativo autenticador e digite o código de 6 dígitos.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="code">
            {useBackupCode ? 'Código de Backup' : 'Código do Autenticador'}
          </Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => {
              setError('');
              if (useBackupCode) {
                setCode(e.target.value.toUpperCase().slice(0, 8));
              } else {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
              }
            }}
            placeholder={useBackupCode ? 'ABC123XY' : '000000'}
            maxLength={useBackupCode ? 8 : 6}
            className="text-center text-2xl font-mono tracking-widest"
            autoFocus
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleVerify}
            disabled={loading || (useBackupCode ? code.length !== 8 : code.length !== 6)}
            className="w-full"
          >
            Verificar
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode('');
              setError('');
            }}
            className="w-full"
          >
            {useBackupCode ? 'Usar código do autenticador' : 'Usar código de backup'}
          </Button>

          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full"
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
