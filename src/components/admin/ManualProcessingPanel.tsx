import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  TestTube,
  Calendar,
  Info,
  HelpCircle
} from 'lucide-react';
import { useProcessSubscriptionsManually } from '@/hooks/useProcessSubscriptionsManually';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ManualProcessingPanel() {
  const [showResults, setShowResults] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const { processSubscriptions, isProcessing, progress } = useProcessSubscriptionsManually();

  const handleProcess = async (dryRun: boolean = false) => {
    setShowResults(false);
    try {
      const result = await processSubscriptions(dryRun);
      setLastResult(result);
      setShowResults(true);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const progressPercentage = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Processamento Manual de Assinaturas
          </CardTitle>
          <CardDescription>
            Force o processamento das assinaturas ativas fora do cronograma automático
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avisos */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              O processamento manual irá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Selecionar perfumes para todas as assinaturas ativas</li>
                <li>Criar envios pendentes no sistema</li>
                <li>Registrar logs de seleção de perfumes</li>
                <li>Enviar notificações para os clientes</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Informações do próximo processamento automático */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Próximo processamento automático:</span>
            </div>
            <p className="text-sm">
              Todo dia 1º de cada mês às 00:00 (horário de Brasília)
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleProcess(true)}
                    disabled={isProcessing}
                    variant="outline"
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Simulando...
                      </>
                    ) : (
                      <>
                        <TestTube className="mr-2 h-4 w-4" />
                        Simular (Dry Run)
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Testa o processamento sem criar envios reais</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleProcess(false)}
                    disabled={isProcessing}
                    variant="default"
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Processar Agora
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Processar todas as assinaturas ativas imediatamente</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Barra de progresso */}
          {isProcessing && progress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span className="font-medium">
                  {progress.current} de {progress.total}
                </span>
              </div>
              <Progress value={progressPercentage} />
            </div>
          )}

          {/* Resultados em tempo real */}
          {isProcessing && progress.details.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Processando:</h4>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {progress.details.map((detail, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm"
                  >
                    {detail.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{detail.message}</p>
                      <p className="text-xs text-muted-foreground">
                        ID: {detail.subscriptionId}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados finais */}
      {showResults && lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {lastResult.errors.length === 0 ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Processamento Concluído com Sucesso
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Processamento Concluído com Avisos
                </>
              )}
            </CardTitle>
            <CardDescription>
              {format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumo */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Processadas</span>
                </div>
                <p className="text-2xl font-bold">{lastResult.processed}</p>
              </div>

              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Erros</span>
                </div>
                <p className="text-2xl font-bold">{lastResult.errors.length}</p>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Total</span>
                </div>
                <p className="text-2xl font-bold">
                  {lastResult.processed + lastResult.errors.length}
                </p>
              </div>
            </div>

            {/* Lista de erros */}
            {lastResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Erros Encontrados
                </h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {lastResult.errors.map((error: any, index: number) => (
                    <div key={index} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-sm font-medium text-red-700 dark:text-red-400">
                        {error.error}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Assinatura ID: {error.subscriptionId}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detalhes completos */}
            {lastResult.details && lastResult.details.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Detalhes do Processamento</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {lastResult.details.map((detail: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 rounded-lg bg-muted/50"
                    >
                      {detail.status === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={detail.status === 'success' ? 'default' : 'destructive'}>
                            {detail.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {detail.subscriptionId}
                          </span>
                        </div>
                        <p className="text-sm">{detail.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
