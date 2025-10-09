import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTwoFactor } from '@/hooks/useTwoFactor';
import { Shield, Copy, Check, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const TwoFactorSetup = () => {
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [step, setStep] = useState<'initial' | 'setup' | 'verify' | 'complete'>('initial');

  const { loading, generateSecret, verifyAndEnable, disable, getSettings } = useTwoFactor();
  const { toast } = useToast();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const settings = await getSettings();
    setIsEnabled(settings?.enabled || false);
    setStep(settings?.enabled ? 'complete' : 'initial');
  };

  const handleGenerateSecret = async () => {
    const result = await generateSecret();
    if (result) {
      setSecret(result.secret);
      setBackupCodes(result.backupCodes);
      
      // Generate QR code URL (otpauth format)
      const issuer = 'Paris%20%26%20Co';
      const label = 'seu-email@exemplo.com'; // You can get from user profile
      const otpauthUrl = `otpauth://totp/${issuer}:${label}?secret=${result.secret}&issuer=${issuer}`;
      
      // Using a QR code generator API
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;
      setQrCode(qrUrl);
      setStep('setup');
    }
  };

  const handleVerify = async () => {
    const success = await verifyAndEnable(verificationCode);
    if (success) {
      setStep('complete');
      setIsEnabled(true);
      setShowBackupCodes(true);
    }
  };

  const handleDisable = async () => {
    const success = await disable();
    if (success) {
      setIsEnabled(false);
      setStep('initial');
      setQrCode('');
      setSecret('');
      setBackupCodes([]);
      setVerificationCode('');
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedCode(true);
    toast({ title: 'Código copiado!' });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast({ title: 'Códigos de backup copiados!' });
  };

  if (step === 'initial') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autenticação de Dois Fatores (2FA)
          </CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              A autenticação de dois fatores protege sua conta exigindo um código adicional
              além da senha. Você precisará de um aplicativo autenticador como Google Authenticator
              ou Authy.
            </AlertDescription>
          </Alert>

          <Button onClick={handleGenerateSecret} disabled={loading} className="w-full">
            <Shield className="mr-2 h-4 w-4" />
            Ativar 2FA
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'setup') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configure seu Autenticador</CardTitle>
          <CardDescription>
            Escaneie o QR Code com seu aplicativo autenticador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            {qrCode && (
              <img src={qrCode} alt="QR Code" className="border rounded-lg p-4" />
            )}
            
            <div className="w-full space-y-2">
              <Label>Ou digite manualmente:</Label>
              <div className="flex gap-2">
                <Input value={secret} readOnly className="font-mono" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copySecret}
                >
                  {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verification">Digite o código do aplicativo</Label>
            <Input
              id="verification"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="text-center text-2xl font-mono tracking-widest"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep('initial')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleVerify}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1"
            >
              Verificar e Ativar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'complete') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            2FA Ativado
          </CardTitle>
          <CardDescription>
            Sua conta está protegida com autenticação de dois fatores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              Sempre que você fizer login, será necessário fornecer um código do seu aplicativo
              autenticador.
            </AlertDescription>
          </Alert>

          {showBackupCodes && backupCodes.length > 0 && (
            <div className="space-y-2">
              <Label>Códigos de Backup (Salve em local seguro!)</Label>
              <Alert variant="destructive">
                <AlertDescription>
                  Guarde estes códigos em um local seguro. Cada um pode ser usado apenas uma vez
                  caso você perca acesso ao seu autenticador.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                {backupCodes.map((code, i) => (
                  <div key={i}>{code}</div>
                ))}
              </div>
              <Button variant="outline" onClick={copyBackupCodes} className="w-full">
                <Copy className="mr-2 h-4 w-4" />
                Copiar Códigos
              </Button>
            </div>
          )}

          <Button
            variant="destructive"
            onClick={handleDisable}
            disabled={loading}
            className="w-full"
          >
            Desativar 2FA
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
};
