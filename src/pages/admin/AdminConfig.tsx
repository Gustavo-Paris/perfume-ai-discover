import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Eye, EyeOff, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ConfigSettings {
  // Fidelidade
  pointsPerReal: number;
  minRedeemPoints: number;
  
  // Shipping
  freeShippingThreshold: number;
  insurancePolicy: 'total' | 'fixed';
  insuranceValue: number;
  
  // Payment
  pixDiscount: number;
  
  // Tokens (masked for security)
  stripePublicKey: string;
  stripeSecretKey: string;
  modoBankPublicKey: string;
  modoBankSecretKey: string;
  melhorEnvioToken: string;
  
  // Analytics
  googleAnalyticsId: string;
  sentryDsn: string;
}

const AdminConfig = () => {
  const [config, setConfig] = useState<ConfigSettings>({
    pointsPerReal: 1,
    minRedeemPoints: 100,
    freeShippingThreshold: 299,
    insurancePolicy: 'total',
    insuranceValue: 50,
    pixDiscount: 0.05,
    stripePublicKey: '',
    stripeSecretKey: '',
    modoBankPublicKey: '',
    modoBankSecretKey: '',
    melhorEnvioToken: '',
    googleAnalyticsId: '',
    sentryDsn: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load configuration from localStorage or API
    const loadConfig = () => {
      try {
        const savedConfig = localStorage.getItem('admin_config');
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig);
          setConfig(parsed);
        }
      } catch (error) {
        console.error('Error loading config:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage (in production, this would be saved to a secure backend)
      localStorage.setItem('admin_config', JSON.stringify(config));
      
      toast({
        title: "Configurações salvas",
        description: "As configurações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const maskSecret = (value: string) => {
    if (!value) return '';
    if (value.length <= 8) return '*'.repeat(value.length);
    return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
  };

  const toggleShowSecret = (field: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando configurações...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Configure parâmetros do sistema
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Programa de Fidelidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Programa de Fidelidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pointsPerReal">Pontos por R$1</Label>
                <Input
                  id="pointsPerReal"
                  type="number"
                  step="0.1"
                  value={config.pointsPerReal}
                  onChange={(e) => setConfig({ ...config, pointsPerReal: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Quantos pontos o cliente ganha para cada R$1 gasto
                </p>
              </div>
              <div>
                <Label htmlFor="minRedeemPoints">Mínimo para Resgate</Label>
                <Input
                  id="minRedeemPoints"
                  type="number"
                  value={config.minRedeemPoints}
                  onChange={(e) => setConfig({ ...config, minRedeemPoints: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Pontos mínimos necessários para resgatar desconto
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Envio */}
        <Card>
          <CardHeader>
            <CardTitle>Envio e Logística</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="freeShippingThreshold">Frete Grátis acima de</Label>
                <Input
                  id="freeShippingThreshold"
                  type="number"
                  step="0.01"
                  value={config.freeShippingThreshold}
                  onChange={(e) => setConfig({ ...config, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="pixDiscount">Desconto PIX (%)</Label>
                <Input
                  id="pixDiscount"
                  type="number"
                  step="0.01"
                  value={config.pixDiscount * 100}
                  onChange={(e) => setConfig({ ...config, pixDiscount: (parseFloat(e.target.value) || 0) / 100 })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="insurancePolicy">Política de Seguro</Label>
                <Select 
                  value={config.insurancePolicy} 
                  onValueChange={(value: 'total' | 'fixed') => setConfig({ ...config, insurancePolicy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total">Valor Total do Pedido</SelectItem>
                    <SelectItem value="fixed">Valor Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="insuranceValue">
                  {config.insurancePolicy === 'fixed' ? 'Valor Fixo do Seguro' : 'Valor Mínimo do Seguro'}
                </Label>
                <Input
                  id="insuranceValue"
                  type="number"
                  step="0.01"
                  value={config.insuranceValue}
                  onChange={(e) => setConfig({ ...config, insuranceValue: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tokens e Chaves da API */}
        <Card>
          <CardHeader>
            <CardTitle>Integrações e APIs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="modoBankPublicKey">Modo Bank - Chave Pública</Label>
                <div className="relative">
                  <Input
                    id="modoBankPublicKey"
                    type={showSecrets.modoBankPublicKey ? "text" : "password"}
                    value={showSecrets.modoBankPublicKey ? config.modoBankPublicKey : maskSecret(config.modoBankPublicKey)}
                    onChange={(e) => setConfig({ ...config, modoBankPublicKey: e.target.value })}
                    placeholder="pk_live_..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-0 h-full"
                    onClick={() => toggleShowSecret('modoBankPublicKey')}
                  >
                    {showSecrets.modoBankPublicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="modoBankSecretKey">Modo Bank - Chave Secreta</Label>
                <div className="relative">
                  <Input
                    id="modoBankSecretKey"
                    type={showSecrets.modoBankSecretKey ? "text" : "password"}
                    value={showSecrets.modoBankSecretKey ? config.modoBankSecretKey : maskSecret(config.modoBankSecretKey)}
                    onChange={(e) => setConfig({ ...config, modoBankSecretKey: e.target.value })}
                    placeholder="sk_live_..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-0 h-full"
                    onClick={() => toggleShowSecret('modoBankSecretKey')}
                  >
                    {showSecrets.modoBankSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="melhorEnvioToken">Melhor Envio - Token</Label>
                <div className="relative">
                  <Input
                    id="melhorEnvioToken"
                    type={showSecrets.melhorEnvioToken ? "text" : "password"}
                    value={showSecrets.melhorEnvioToken ? config.melhorEnvioToken : maskSecret(config.melhorEnvioToken)}
                    onChange={(e) => setConfig({ ...config, melhorEnvioToken: e.target.value })}
                    placeholder="Token do Melhor Envio"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-0 h-full"
                    onClick={() => toggleShowSecret('melhorEnvioToken')}
                  >
                    {showSecrets.melhorEnvioToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                <Input
                  id="googleAnalyticsId"
                  value={config.googleAnalyticsId}
                  onChange={(e) => setConfig({ ...config, googleAnalyticsId: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div>
                <Label htmlFor="sentryDsn">Sentry DSN</Label>
                <div className="relative">
                  <Input
                    id="sentryDsn"
                    type={showSecrets.sentryDsn ? "text" : "password"}
                    value={showSecrets.sentryDsn ? config.sentryDsn : maskSecret(config.sentryDsn)}
                    onChange={(e) => setConfig({ ...config, sentryDsn: e.target.value })}
                    placeholder="https://..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-0 h-full"
                    onClick={() => toggleShowSecret('sentryDsn')}
                  >
                    {showSecrets.sentryDsn ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Settings className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-900 dark:text-orange-100">
                  Configurações Sensíveis
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  As configurações desta página afetam diretamente o funcionamento da loja. 
                  Certifique-se de testar todas as mudanças em ambiente de homologação antes de aplicar em produção.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminConfig;