import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  RefreshCw,
  RotateCcw
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NFEMetrics {
  total: number;
  authorized: number;
  pending: number;
  rejected: number;
  cancelled: number;
  successRate: number;
  last24h: number;
  errorRate: number;
}

interface FailedNFE {
  id: string;
  order_id: string;
  order_number: string;
  created_at: string;
  erro_message: string;
  valor_total: number;
}

export const NFeDashboard = () => {
  const [metrics, setMetrics] = useState<NFEMetrics>({
    total: 0,
    authorized: 0,
    pending: 0,
    rejected: 0,
    cancelled: 0,
    successRate: 0,
    last24h: 0,
    errorRate: 0
  });
  const [failedNFEs, setFailedNFEs] = useState<FailedNFE[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load metrics
      const { data: allNotes, error: notesError } = await supabase
        .from('fiscal_notes')
        .select('status, created_at');

      if (notesError) throw notesError;

      const total = allNotes?.length || 0;
      const authorized = allNotes?.filter(n => n.status === 'authorized').length || 0;
      const pending = allNotes?.filter(n => n.status === 'pending').length || 0;
      const rejected = allNotes?.filter(n => n.status === 'rejected').length || 0;
      const cancelled = allNotes?.filter(n => n.status === 'cancelled').length || 0;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const last24h = allNotes?.filter(n => new Date(n.created_at) > yesterday).length || 0;

      const successRate = total > 0 ? (authorized / total) * 100 : 0;
      const errorRate = total > 0 ? (rejected / total) * 100 : 0;

      setMetrics({
        total,
        authorized,
        pending,
        rejected,
        cancelled,
        successRate,
        last24h,
        errorRate
      });

      // Load failed NFEs
      const { data: failed, error: failedError } = await supabase
        .from('fiscal_notes')
        .select(`
          id,
          order_id,
          created_at,
          erro_message,
          valor_total,
          order:orders!inner(order_number)
        `)
        .or('status.eq.rejected,erro_message.not.is.null')
        .order('created_at', { ascending: false })
        .limit(5);

      if (failedError) throw failedError;

      const formattedFailed = failed?.map(note => ({
        ...note,
        order_number: (note.order as any).order_number
      })) || [];

      setFailedNFEs(formattedFailed);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Erro ao Carregar Dashboard",
        description: "Não foi possível carregar os dados do dashboard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const retryNFE = async (orderId: string, nfeId: string) => {
    setRetryingId(nfeId);
    try {
      const { error } = await supabase.functions.invoke('retry-nfe-generation', {
        body: { order_id: orderId }
      });

      if (error) throw error;

      toast({
        title: "NF-e Processada",
        description: "A regeneração da nota fiscal foi iniciada.",
      });

      loadDashboardData();
    } catch (error) {
      console.error('Error retrying NF-e:', error);
      toast({
        title: "Erro ao Processar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setRetryingId(null);
    }
  };

  const getHealthStatus = () => {
    if (metrics.successRate >= 95) {
      return { status: 'excellent', text: 'Excelente', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle };
    } else if (metrics.successRate >= 85) {
      return { status: 'good', text: 'Bom', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: TrendingUp };
    } else if (metrics.successRate >= 70) {
      return { status: 'warning', text: 'Atenção', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: AlertTriangle };
    }
    return { status: 'critical', text: 'Crítico', color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle };
  };

  const health = getHealthStatus();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de NF-e</h2>
          <p className="text-sm text-muted-foreground">Monitoramento em tempo real do sistema</p>
        </div>
        <Button onClick={loadDashboardData} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Health Status */}
      <Card className={health.bgColor}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <health.icon className={`w-12 h-12 ${health.color}`} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Status do Sistema: {health.text}</h3>
              <p className="text-sm text-muted-foreground">
                Taxa de sucesso: {metrics.successRate.toFixed(1)}% | 
                Taxa de erro: {metrics.errorRate.toFixed(1)}%
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{metrics.total}</div>
              <div className="text-sm text-muted-foreground">NFes Totais</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Authorized */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Autorizadas</p>
                <p className="text-3xl font-bold text-green-600">{metrics.authorized}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.total > 0 ? ((metrics.authorized / metrics.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        {/* Rejected */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejeitadas</p>
                <p className="text-3xl font-bold text-red-600">{metrics.rejected}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-600 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.total > 0 ? ((metrics.rejected / metrics.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-3xl font-bold text-yellow-600">{metrics.pending}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-600 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Aguardando processamento
            </p>
          </CardContent>
        </Card>

        {/* Last 24h */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Últimas 24h</p>
                <p className="text-3xl font-bold text-blue-600">{metrics.last24h}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-600 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              NFes geradas recentemente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Failed NFEs */}
      {failedNFEs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              NFes com Falha - Ação Necessária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {failedNFEs.map((nfe) => (
                <Alert key={nfe.id} variant="destructive">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <AlertDescription>
                        <div className="font-semibold mb-1">
                          Pedido: {nfe.order_number} | R$ {nfe.valor_total.toFixed(2)}
                        </div>
                        <div className="text-xs opacity-90 mb-2">
                          {new Date(nfe.created_at).toLocaleString('pt-BR')}
                        </div>
                        <div className="text-sm">
                          <strong>Erro:</strong> {nfe.erro_message || 'Erro desconhecido'}
                        </div>
                      </AlertDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => retryNFE(nfe.order_id, nfe.id)}
                      disabled={retryingId === nfe.id}
                      className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 shrink-0"
                    >
                      <RotateCcw className="w-4 h-4" />
                      {retryingId === nfe.id ? 'Processando...' : 'Tentar Novamente'}
                    </Button>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total de NFes:</span>
              <span className="ml-2 font-semibold">{metrics.total}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Autorizadas:</span>
              <span className="ml-2 font-semibold text-green-600">{metrics.authorized}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Rejeitadas:</span>
              <span className="ml-2 font-semibold text-red-600">{metrics.rejected}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Pendentes:</span>
              <span className="ml-2 font-semibold text-yellow-600">{metrics.pending}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Canceladas:</span>
              <span className="ml-2 font-semibold text-gray-600">{metrics.cancelled}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Últimas 24h:</span>
              <span className="ml-2 font-semibold text-blue-600">{metrics.last24h}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
