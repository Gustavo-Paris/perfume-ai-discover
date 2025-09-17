import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Eye, EyeOff, Save, Key, CheckCircle, XCircle, AlertTriangle, RefreshCw, Package, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
}

interface ApiSecret {
  name: string;
  label: string;
  placeholder: string;
  description: string;
  status: 'configured' | 'missing' | 'unknown';
  required: boolean;
  category: 'payment' | 'shipping' | 'ai' | 'email' | 'analytics';
}

const AdminConfig = () => {
  const [config, setConfig] = useState<ConfigSettings>({
    pointsPerReal: 1,
    minRedeemPoints: 100,
    freeShippingThreshold: 299,
    insurancePolicy: 'total',
    insuranceValue: 50,
    pixDiscount: 0.05,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [secretsStatus, setSecretsStatus] = useState<Record<string, 'configured' | 'missing' | 'unknown'>>({});
  const [checkingSecrets, setCheckingSecrets] = useState(false);
  const [lastSecretsCheck, setLastSecretsCheck] = useState<string | null>(null);

  // Função para verificar status das chaves no Supabase
  const checkSecretsStatus = async () => {
    setCheckingSecrets(true);
    try {
      
      
      const { data, error } = await supabase.functions.invoke('check-secrets', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      
      
      if (error) {
        console.error('❌ Supabase function error:', error);
        toast({
          title: "Erro",
          description: `Erro ao verificar status das chaves: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        console.error('❌ Function returned error:', data);
        toast({
          title: "Erro",
          description: `Erro na função: ${data.error}`,
          variant: "destructive",
        });
        return;
      }

      if (data?.secrets) {
        setSecretsStatus(data.secrets);
        setLastSecretsCheck(data.lastChecked);
        
        toast({
          title: "Status verificado",
          description: `${data.summary.configured}/${data.summary.total} chaves configuradas (${data.summary.percentage}%)`,
        });
      } else {
        console.warn('⚠️ No secrets data returned:', data);
        toast({
          title: "Aviso",
          description: "Resposta inesperada da verificação de chaves.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Exception in checkSecretsStatus:', error);
      toast({
        title: "Erro",
        description: `Erro na verificação: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setCheckingSecrets(false);
    }
  };

  // API Secrets configuration - agora usa o status real do Supabase
  const getSecretStatus = (secretName: string): 'configured' | 'missing' | 'unknown' => {
    return secretsStatus[secretName] || 'unknown';
  };

  const apiSecrets: ApiSecret[] = [
    {
      name: 'MODO_BANK_PUBLIC_KEY',
      label: 'Modo Bank - Chave Pública',
      placeholder: 'pk_live_...',
      description: 'Chave pública para processar pagamentos via Modo Bank',
      status: getSecretStatus('MODO_BANK_PUBLIC_KEY'),
      required: true,
      category: 'payment'
    },
    {
      name: 'MODO_BANK_SECRET_KEY',
      label: 'Modo Bank - Chave Secreta',
      placeholder: 'sk_live_...',
      description: 'Chave secreta para processar pagamentos via Modo Bank',
      status: getSecretStatus('MODO_BANK_SECRET_KEY'),
      required: true,
      category: 'payment'
    },
    {
      name: 'MELHOR_ENVIO_TOKEN',
      label: 'Melhor Envio - Token',
      placeholder: 'Token do Melhor Envio',
      description: 'Token para calcular frete e gerar etiquetas',
      status: getSecretStatus('MELHOR_ENVIO_TOKEN'),
      required: true,
      category: 'shipping'
    },
    {
      name: 'MELHOR_ENVIO_CLIENT_ID',
      label: 'Melhor Envio - Client ID',
      placeholder: 'Client ID do Melhor Envio',
      description: 'ID do cliente para integração com Melhor Envio',
      status: getSecretStatus('MELHOR_ENVIO_CLIENT_ID'),
      required: true,
      category: 'shipping'
    },
    {
      name: 'MELHOR_ENVIO_CLIENT_SECRET',
      label: 'Melhor Envio - Client Secret',
      placeholder: 'Client Secret do Melhor Envio',
      description: 'Secret do cliente para integração com Melhor Envio',
      status: getSecretStatus('MELHOR_ENVIO_CLIENT_SECRET'),
      required: true,
      category: 'shipping'
    },
    {
      name: 'OPENAI_API_KEY',
      label: 'OpenAI - API Key',
      placeholder: 'sk-...',
      description: 'Chave para recomendações de perfumes com IA',
      status: getSecretStatus('OPENAI_API_KEY'),
      required: false,
      category: 'ai'
    },
    {
      name: 'ALGOLIA_APP_ID',
      label: 'Algolia - App ID',
      placeholder: 'XXXXXXXXXX',
      description: 'ID da aplicação Algolia para busca',
      status: getSecretStatus('ALGOLIA_APP_ID'),
      required: false,
      category: 'ai'
    },
    {
      name: 'ALGOLIA_SEARCH_KEY',
      label: 'Algolia - Search Key',
      placeholder: 'Chave de busca Algolia',
      description: 'Chave pública para busca no frontend',
      status: getSecretStatus('ALGOLIA_SEARCH_KEY'),
      required: false,
      category: 'ai'
    },
    {
      name: 'ALGOLIA_ADMIN_KEY',
      label: 'Algolia - Admin Key',
      placeholder: 'Chave admin Algolia',
      description: 'Chave admin para sincronizar produtos',
      status: getSecretStatus('ALGOLIA_ADMIN_KEY'),
      required: false,
      category: 'ai'
    },
    {
      name: 'RESEND_API_KEY',
      label: 'Resend - API Key',
      placeholder: 're_...',
      description: 'Chave para envio de emails transacionais',
      status: getSecretStatus('RESEND_API_KEY'),
      required: false,
      category: 'email'
    },
    {
      name: 'GA_MEASUREMENT_ID',
      label: 'Google Analytics - Measurement ID',
      placeholder: 'G-XXXXXXXXXX',
      description: 'ID para tracking do Google Analytics 4',
      status: getSecretStatus('GA_MEASUREMENT_ID'),
      required: false,
      category: 'analytics'
    },
    {
      name: 'SENTRY_DSN',
      label: 'Sentry - DSN',
      placeholder: 'https://...',
      description: 'URL para monitoramento de erros',
      status: getSecretStatus('SENTRY_DSN'),
      required: false,
      category: 'analytics'
    },
    {
      name: 'STRIPE_SECRET_KEY',
      label: 'Stripe - Secret Key',
      placeholder: 'sk_live_... ou sk_test_...',
      description: 'Chave secreta para processar pagamentos via Stripe',
      status: getSecretStatus('STRIPE_SECRET_KEY'),
      required: true,
      category: 'payment'
    }
  ];

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
    
    // Verificar status das chaves automaticamente
    checkSecretsStatus();
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'configured':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'missing':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string, required: boolean) => {
    const variant = status === 'configured' ? 'default' : 
                   status === 'missing' && required ? 'destructive' : 'secondary';
    
    const text = status === 'configured' ? 'Configurado' :
                 status === 'missing' ? (required ? 'Obrigatório' : 'Opcional') : 'Desconhecido';
    
    return <Badge variant={variant} className="ml-2">{text}</Badge>;
  };

  const groupedSecrets = apiSecrets.reduce((acc, secret) => {
    if (!acc[secret.category]) {
      acc[secret.category] = [];
    }
    acc[secret.category].push(secret);
    return acc;
  }, {} as Record<string, ApiSecret[]>);

  const categoryLabels = {
    payment: 'Pagamentos',
    shipping: 'Envio e Logística',
    ai: 'IA e Busca',
    email: 'Email',
    analytics: 'Analytics e Monitoramento'
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
            Configure parâmetros do sistema e chaves de API
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">Configurações Gerais</TabsTrigger>
          <TabsTrigger value="secrets">Chaves de API</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="secrets" className="space-y-6">
          {/* Header com botão de verificação */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Status das Chaves de API
                  </CardTitle>
                  {lastSecretsCheck && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Última verificação: {new Date(lastSecretsCheck).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
                <Button 
                  onClick={checkSecretsStatus} 
                  disabled={checkingSecrets}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${checkingSecrets ? 'animate-spin' : ''}`} />
                  {checkingSecrets ? 'Verificando...' : 'Verificar Status'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(secretsStatus).filter(s => s === 'configured').length}
                  </div>
                  <div className="text-sm text-green-700">Configuradas</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">
                    {Object.values(secretsStatus).filter(s => s === 'missing' || s === 'unknown').length}
                  </div>
                  <div className="text-sm text-red-700">Faltando</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-gray-600">
                    {apiSecrets.length}
                  </div>
                  <div className="text-sm text-gray-700">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {Object.entries(groupedSecrets).map(([category, secrets]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {secrets.map((secret) => (
                  <div key={secret.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        {getStatusIcon(secret.status)}
                        {secret.label}
                        {getStatusBadge(secret.status, secret.required)}
                      </Label>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {secret.description}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder={secret.placeholder}
                        value="••••••••••••••••"
                        disabled
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.open(
                            'https://supabase.com/dashboard/project/dd10df9e-f817-40ce-8443-912ed0720041/settings/functions',
                            '_blank'
                          );
                        }}
                      >
                        Configurar no Supabase
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Key className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">
                    Gerenciamento de Secrets
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    As chaves de API são gerenciadas de forma segura através do Supabase. 
                    Use o dashboard do Supabase para configurar esses valores de forma segura.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
  );
};

export default AdminConfig;