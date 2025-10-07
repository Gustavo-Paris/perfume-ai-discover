import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Bell, RefreshCw, Settings } from 'lucide-react';

interface AlertConfig {
  id: string;
  alert_type: string;
  threshold_value: number;
  time_window_minutes: number;
  is_enabled: boolean;
  notification_channels: string[];
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  failed_login_attempts: 'Tentativas de Login Falhadas',
  critical_events: 'Eventos Críticos',
  rate_limit_exceeded: 'Rate Limit Excedido',
  unauthorized_access: 'Acesso Não Autorizado',
};

const SecurityAlertConfig = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: configs, isLoading } = useQuery({
    queryKey: ['security-alert-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_alert_config')
        .select('*')
        .order('alert_type');

      if (error) throw error;
      return data as AlertConfig[];
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AlertConfig> }) => {
      const { error } = await supabase
        .from('security_alert_config')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alert-configs'] });
      toast({
        title: 'Configuração atualizada',
        description: 'As configurações de alerta foram atualizadas com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const triggerMonitorMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('security-monitor');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Monitoramento executado',
        description: `${data.alerts_triggered} alerta(s) disparado(s)`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao executar monitoramento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleToggleEnabled = (config: AlertConfig) => {
    updateConfigMutation.mutate({
      id: config.id,
      updates: { is_enabled: !config.is_enabled },
    });
  };

  const handleUpdateThreshold = (config: AlertConfig, value: number) => {
    updateConfigMutation.mutate({
      id: config.id,
      updates: { threshold_value: value },
    });
  };

  const handleUpdateTimeWindow = (config: AlertConfig, value: number) => {
    updateConfigMutation.mutate({
      id: config.id,
      updates: { time_window_minutes: value },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configurações de Alertas de Segurança
              </CardTitle>
              <CardDescription>
                Configure thresholds e notificações para eventos de segurança
              </CardDescription>
            </div>
            <Button
              onClick={() => triggerMonitorMutation.mutate()}
              disabled={triggerMonitorMutation.isPending}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${triggerMonitorMutation.isPending ? 'animate-spin' : ''}`} />
              Executar Monitoramento
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6">
        {configs?.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {ALERT_TYPE_LABELS[config.alert_type] || config.alert_type}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {config.alert_type === 'failed_login_attempts' && 
                      'Detecta múltiplas tentativas de login falhadas do mesmo IP'}
                    {config.alert_type === 'critical_events' && 
                      'Monitora eventos com nível de risco crítico'}
                    {config.alert_type === 'rate_limit_exceeded' && 
                      'Detecta quando rate limits são excedidos frequentemente'}
                    {config.alert_type === 'unauthorized_access' && 
                      'Monitora tentativas de acesso não autorizado'}
                  </CardDescription>
                </div>
                <Switch
                  checked={config.is_enabled}
                  onCheckedChange={() => handleToggleEnabled(config)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`threshold-${config.id}`}>
                    Threshold (número de eventos)
                  </Label>
                  <Input
                    id={`threshold-${config.id}`}
                    type="number"
                    min="1"
                    value={config.threshold_value}
                    onChange={(e) => handleUpdateThreshold(config, parseInt(e.target.value))}
                    disabled={!config.is_enabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`window-${config.id}`}>
                    Janela de tempo (minutos)
                  </Label>
                  <Input
                    id={`window-${config.id}`}
                    type="number"
                    min="1"
                    value={config.time_window_minutes}
                    onChange={(e) => handleUpdateTimeWindow(config, parseInt(e.target.value))}
                    disabled={!config.is_enabled}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <span className="text-sm text-muted-foreground">Canais de notificação:</span>
                {config.notification_channels.map((channel) => (
                  <Badge key={channel} variant="secondary">
                    {channel}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SecurityAlertConfig;
