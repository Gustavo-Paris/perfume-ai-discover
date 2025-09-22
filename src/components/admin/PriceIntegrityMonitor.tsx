import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, RefreshCw, Zap, Clock, Settings } from 'lucide-react';
import { usePriceIntegrity, useAutoFixPrices, useDailyIntegrityCheck } from '@/hooks/usePriceIntegrity';
import { usePriceLogs } from '@/hooks/usePriceLogs';
import { useFixPerfumeMargin } from '@/hooks/useFixPerfumeMargin';

const PriceIntegrityMonitor = () => {
  const { data: integrityIssues, isLoading: isLoadingIntegrity, refetch: refetchIntegrity } = usePriceIntegrity();
  const { data: logs, isLoading: isLoadingLogs } = usePriceLogs(50);
  const autoFixMutation = useAutoFixPrices();
  const dailyCheckMutation = useDailyIntegrityCheck();
  const fixMarginMutation = useFixPerfumeMargin();

  const handleFixMargin = (perfumeId: string) => {
    fixMarginMutation.mutate({
      perfumeId,
      newMarginPercentage: 2.0 // 100% margem (preço = 2x custo)
    });
  };

  const getIssueColor = (issueType: string) => {
    switch (issueType) {
      case 'zero_prices':
        return 'destructive';
      case 'zero_cost':
        return 'destructive';
      case 'low_margin':
        return 'secondary';
      case 'high_margin':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'batch_auto_fix':
        return <Zap className="h-4 w-4" />;
      case 'auto_trigger':
        return <RefreshCw className="h-4 w-4" />;
      case 'manual_fix':
        return <CheckCircle className="h-4 w-4" />;
      case 'margin_auto_fix':
        return <Settings className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatExecutionTime = (timeMs: number | null) => {
    if (!timeMs) return '-';
    return `${timeMs.toFixed(0)}ms`;
  };

  return (
    <div className="space-y-6">
      {/* Status e Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Sistema de Integridade dos Preços
          </CardTitle>
          <CardDescription>
            Monitore e corrija automaticamente problemas nos preços dos perfumes. 
            <br />
            <strong>Novo:</strong> Agora corrige margens baixas e altas automaticamente!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Button
              onClick={() => refetchIntegrity()}
              disabled={isLoadingIntegrity}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingIntegrity ? 'animate-spin' : ''}`} />
              Verificar Integridade
            </Button>
            
            <Button
              onClick={() => autoFixMutation.mutate()}
              disabled={autoFixMutation.isPending}
              variant="default"
            >
              <Zap className="h-4 w-4 mr-2" />
              {autoFixMutation.isPending ? 'Corrigindo...' : 'Correção Automática'}
            </Button>

            <Button
              onClick={() => dailyCheckMutation.mutate()}
              disabled={dailyCheckMutation.isPending}
              variant="secondary"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {dailyCheckMutation.isPending ? 'Verificando...' : 'Verificação Completa'}
            </Button>
          </div>

          {/* Status Atual */}
          {isLoadingIntegrity ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : integrityIssues && integrityIssues.length > 0 ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {integrityIssues.length} problema(s) detectado(s) nos preços. Use "Correção Automática" ou corrija individualmente.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Todos os preços estão corretos! ✅
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Problemas Encontrados */}
      {integrityIssues && integrityIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Problemas Detectados</CardTitle>
            <CardDescription>
              Lista de perfumes com problemas nos preços. Use correção individual ou em lote.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Perfume</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Problema</TableHead>
                    <TableHead>Ação Sugerida</TableHead>
                    <TableHead>Correção</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrityIssues.map((issue) => (
                    <TableRow key={issue.perfume_id}>
                      <TableCell className="font-medium">{issue.perfume_name}</TableCell>
                      <TableCell>{issue.brand}</TableCell>
                      <TableCell>
                        <Badge variant={getIssueColor(issue.issue_type)}>
                          {issue.issue_type === 'low_margin' ? 'Margem Baixa' :
                           issue.issue_type === 'high_margin' ? 'Margem Alta' :
                           issue.issue_type === 'zero_prices' ? 'Preços Zerados' :
                           issue.issue_type === 'zero_cost' ? 'Sem Custo' :
                           issue.issue_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {issue.suggested_action}
                      </TableCell>
                      <TableCell>
                        {issue.issue_type === 'low_margin' || issue.issue_type === 'high_margin' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFixMargin(issue.perfume_id)}
                            disabled={fixMarginMutation.isPending}
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            {fixMarginMutation.isPending ? 'Corrigindo...' : 'Aplicar 100%'}
                          </Button>
                        ) : (
                          <span className="text-sm text-gray-500">Usar correção automática</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Atividade Recente</CardTitle>
          <CardDescription>
            Histórico das operações de cálculo e correção de preços
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="rounded-md border max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Tempo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionTypeIcon(log.action_type)}
                          <span className="text-sm">
                            {log.action_type === 'margin_auto_fix' ? 'Correção de Margem' :
                             log.action_type === 'batch_auto_fix' ? 'Correção em Lote' :
                             log.action_type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{log.trigger_source}</TableCell>
                      <TableCell className="text-sm">
                        {formatExecutionTime(log.execution_time_ms)}
                      </TableCell>
                      <TableCell>
                        {log.error_message ? (
                          <Badge variant="destructive">Erro</Badge>
                        ) : (
                          <Badge variant="default">Sucesso</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              Nenhum log disponível ainda.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceIntegrityMonitor;