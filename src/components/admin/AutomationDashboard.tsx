import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  FileText, 
  Mail, 
  Package, 
  Calendar,
  Settings,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react';

export function AutomationDashboard() {
  const [settings, setSettings] = useState({
    auto_nfe: true,
    auto_email: true,
    focus_nfe_environment: 'homologacao',
    melhor_envio_environment: 'sandbox',
    email_service: 'disabled'
  });
  const { toast } = useToast();

  const automationFeatures = [
    {
      id: 'payment_confirmed',
      title: 'Pagamento Confirmado',
      description: 'Automação completa após confirmação do pagamento',
      icon: CheckCircle2,
      status: 'active',
      steps: [
        '✅ NF-e gerada automaticamente',
        '✅ Email de confirmação enviado',
        '✅ Status atualizado para "Processando"'
      ]
    },
    {
      id: 'manual_shipping',
      title: 'Envio Manual',
      description: 'Controle manual da geração de etiquetas e coleta',
      icon: Package,
      status: 'active',
      steps: [
        '🎯 Gerar etiqueta quando pronto',
        '🎯 Download interno da etiqueta',
        '🎯 Agendar coleta no sistema'
      ]
    },
    {
      id: 'tracking_updates',
      title: 'Atualizações Automáticas',
      description: 'Webhooks do Melhor Envio para tracking',
      icon: Bot,
      status: 'active',
      steps: [
        '🔄 Status postado automaticamente',
        '🔄 Status entregue automaticamente',
        '🔄 Pontos de bônus por entrega'
      ]
    }
  ];

  const testEnvironments = [
    {
      service: 'Focus NFe',
      environment: settings.focus_nfe_environment,
      endpoint: settings.focus_nfe_environment === 'producao' 
        ? 'api.focusnfe.com.br' 
        : 'homologacao.focusnfe.com.br',
      status: 'configured'
    },
    {
      service: 'Melhor Envio',
      environment: settings.melhor_envio_environment,
      endpoint: settings.melhor_envio_environment === 'production'
        ? 'melhorenvio.com.br'
        : 'sandbox.melhorenvio.com.br',
      status: 'configured'
    },
    {
      service: 'Email Service',
      environment: settings.email_service,
      endpoint: settings.email_service === 'active' ? 'resend.com' : 'disabled',
      status: settings.email_service === 'active' ? 'configured' : 'disabled'
    }
  ];

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Configuração Atualizada",
      description: `${key} foi atualizado para ${value}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Zap className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Automação do Sistema</h1>
          <p className="text-muted-foreground">
            Controle completo das automações de pedidos, NF-e e envios
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="environments">Ambientes</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="flow">Fluxo Completo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {automationFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {feature.title}
                      <Badge variant={feature.status === 'active' ? 'default' : 'secondary'}>
                        {feature.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {feature.description}
                    </p>
                    <div className="space-y-2">
                      {feature.steps.map((step, idx) => (
                        <div key={idx} className="text-sm">
                          {step}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="environments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ambientes de Teste e Produção</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testEnvironments.map((env, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{env.service}</h3>
                      <p className="text-sm text-muted-foreground">
                        Ambiente: <span className="font-mono">{env.environment}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Endpoint: <span className="font-mono">{env.endpoint}</span>
                      </p>
                    </div>
                    <Badge variant={env.status === 'configured' ? 'default' : 'secondary'}>
                      {env.status === 'configured' ? 'Configurado' : 'Desabilitado'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Automação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto_nfe">NF-e Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Gerar NF-e automaticamente após pagamento confirmado
                  </p>
                </div>
                <Switch
                  id="auto_nfe"
                  checked={settings.auto_nfe}
                  onCheckedChange={(value) => handleSettingChange('auto_nfe', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto_email">Emails Automáticos</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar emails de confirmação automaticamente
                  </p>
                </div>
                <Switch
                  id="auto_email"
                  checked={settings.auto_email}
                  onCheckedChange={(value) => handleSettingChange('auto_email', value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="focus_env">Ambiente Focus NFe</Label>
                  <select
                    id="focus_env"
                    className="w-full mt-1 p-2 border rounded"
                    value={settings.focus_nfe_environment}
                    onChange={(e) => handleSettingChange('focus_nfe_environment', e.target.value)}
                  >
                    <option value="homologacao">Homologação (Teste)</option>
                    <option value="producao">Produção</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="me_env">Ambiente Melhor Envio</Label>
                  <select
                    id="me_env"
                    className="w-full mt-1 p-2 border rounded"
                    value={settings.melhor_envio_environment}
                    onChange={(e) => handleSettingChange('melhor_envio_environment', e.target.value)}
                  >
                    <option value="sandbox">Sandbox (Teste)</option>
                    <option value="production">Produção</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo Completo Automatizado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-800">1. Pagamento Confirmado</h3>
                    <p className="text-sm text-green-700">
                      Automaticamente: NF-e gerada → Email enviado → Status atualizado
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-800">2. Preparação Manual</h3>
                    <p className="text-sm text-blue-700">
                      Admin gera etiqueta quando pronto para envio
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <Package className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-purple-800">3. Envio e Coleta</h3>
                    <p className="text-sm text-purple-700">
                      Download da etiqueta → Agendamento de coleta → Entrega
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <Bot className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-800">4. Tracking Automático</h3>
                    <p className="text-sm text-orange-700">
                      Webhooks atualizam status automaticamente até a entrega
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">⚙️ Configuração Atual</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Focus NFe:</strong> {settings.focus_nfe_environment}
                  </div>
                  <div>
                    <strong>Melhor Envio:</strong> {settings.melhor_envio_environment}
                  </div>
                  <div>
                    <strong>NF-e Automática:</strong> {settings.auto_nfe ? 'Ativa' : 'Inativa'}
                  </div>
                  <div>
                    <strong>Emails:</strong> {settings.auto_email ? 'Ativos' : 'Inativos'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}