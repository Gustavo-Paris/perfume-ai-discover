import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSecurityMetrics } from '@/hooks/useSecurityMetrics';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Lock,
  Activity,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SecurityMetricsDashboard() {
  const { metrics, timeSeries, suspiciousActivities, isLoading } = useSecurityMetrics(7);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner size="lg" text="Carregando métricas de segurança..." />
      </div>
    );
  }

  const loginSuccessRate = metrics?.totalLoginAttempts 
    ? ((metrics.successfulLogins / metrics.totalLoginAttempts) * 100).toFixed(1)
    : '0';

  const hasSuspiciousActivity = (suspiciousActivities?.length || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Alertas de Segurança */}
      {hasSuspiciousActivity && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atividade Suspeita Detectada</AlertTitle>
          <AlertDescription>
            {suspiciousActivities?.length} endereço(s) IP com múltiplas tentativas de login falhadas.
            Verifique os logs de segurança para mais detalhes.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="login">Login & Autenticação</TabsTrigger>
          <TabsTrigger value="access">Acessos & Dados</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Taxa de Sucesso de Login */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loginSuccessRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.successfulLogins} de {metrics?.totalLoginAttempts} tentativas
                </p>
              </CardContent>
            </Card>

            {/* Tentativas Bloqueadas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bloqueios</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.blockedAttempts}</div>
                <p className="text-xs text-muted-foreground">
                  Tentativas bloqueadas (últimos 7 dias)
                </p>
              </CardContent>
            </Card>

            {/* IPs Únicos */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">IPs Únicos</CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.uniqueIPs}</div>
                <p className="text-xs text-muted-foreground">
                  Endereços IP diferentes
                </p>
              </CardContent>
            </Card>

            {/* Acessos Admin */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Acessos Admin</CardTitle>
                <Shield className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.adminAccessCount}</div>
                <p className="text-xs text-muted-foreground">
                  Acessos a áreas administrativas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Tendências */}
          {timeSeries && timeSeries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tendência de Autenticação (7 dias)</CardTitle>
                <CardDescription>
                  Comparação entre logins bem-sucedidos e tentativas falhadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {timeSeries.slice(-7).map((day) => (
                    <div key={day.date} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('pt-BR', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="flex-1 flex gap-2 items-center">
                        <div className="flex-1 bg-green-100 dark:bg-green-900/20 rounded-full h-6 flex items-center px-2">
                          <div 
                            className="bg-green-600 h-4 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (day.successful_logins / 10) * 100)}%` }}
                          />
                          <span className="ml-2 text-xs font-medium">
                            {day.successful_logins} ✓
                          </span>
                        </div>
                        <div className="flex-1 bg-red-100 dark:bg-red-900/20 rounded-full h-6 flex items-center px-2">
                          <div 
                            className="bg-red-600 h-4 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (day.failed_attempts / 10) * 100)}%` }}
                          />
                          <span className="ml-2 text-xs font-medium">
                            {day.failed_attempts} ✗
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* IPs Suspeitos */}
          {suspiciousActivities && suspiciousActivities.length > 0 && (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Atividades Suspeitas Detectadas
                </CardTitle>
                <CardDescription>
                  IPs com tentativas excessivas de login falhado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {suspiciousActivities.map(({ ip, count }) => (
                    <div key={ip} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <code className="text-sm font-mono">{ip}</code>
                      </div>
                      <Badge variant="destructive">
                        {count} tentativas falhadas
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="login" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total de Tentativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics?.totalLoginAttempts}</div>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-muted-foreground">Últimos 7 dias</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Logins Bem-Sucedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{metrics?.successfulLogins}</div>
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-muted-foreground">{loginSuccessRate}% de sucesso</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Tentativas Falhadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{metrics?.failedLoginAttempts}</div>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-xs text-muted-foreground">
                    {((metrics?.failedLoginAttempts || 0) / (metrics?.totalLoginAttempts || 1) * 100).toFixed(1)}% das tentativas
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Acessos a Dados Sensíveis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Endereços</span>
                  <Badge variant="outline">{metrics?.addressAccessCount} acessos</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Dados de Negócio</span>
                  <Badge variant="outline">{metrics?.businessDataAccessCount} acessos</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Logs de Acesso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total de Acessos</span>
                  <Badge variant="outline">{metrics?.totalAccessLogs}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Acessos Admin</span>
                  <Badge variant="outline">{metrics?.adminAccessCount}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auditoria de Compliance</CardTitle>
              <CardDescription>
                Logs de conformidade e ações regulatórias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics?.complianceAuditCount}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Eventos de auditoria registrados nos últimos 7 dias
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
