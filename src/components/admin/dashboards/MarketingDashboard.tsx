import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketingMetrics, useMarketingTrends, useCACByCoupon } from '@/hooks/useMarketingMetrics';
import { 
  useTopCouponsByROI, 
  useTopCouponsByRevenue, 
  useTopCouponsByUsage,
  useCouponConversionRates,
  useCouponAbandonmentAnalysis
} from '@/hooks/useCouponAnalytics';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, DollarSign, Percent, Users, ShoppingCart, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const MarketingDashboard = () => {
  const { data: metrics, isLoading: metricsLoading } = useMarketingMetrics();
  const { data: trends, isLoading: trendsLoading } = useMarketingTrends(6);
  const { data: topROI, isLoading: roiLoading } = useTopCouponsByROI(10);
  const { data: topRevenue, isLoading: revenueLoading } = useTopCouponsByRevenue(10);
  const { data: topUsage, isLoading: usageLoading } = useTopCouponsByUsage(10);
  const { data: conversionRates, isLoading: conversionLoading } = useCouponConversionRates();
  const { data: abandonmentData, isLoading: abandonmentLoading } = useCouponAbandonmentAnalysis();
  const { data: cacData, isLoading: cacLoading } = useCACByCoupon();

  if (metricsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard de Marketing & Cupons</h2>
        <p className="text-muted-foreground">
          Análise completa de performance de cupons e estratégias de marketing
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cupons Ativos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalCouponsActive || 0}</div>
            <p className="text-xs text-muted-foreground">Cupons disponíveis para uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desconto Total Concedido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {metrics?.totalDiscountGiven.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">Total investido em descontos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Gerada</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {metrics?.totalRevenueFromCoupons.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">Receita total com cupons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Médio</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.averageRoi.toFixed(1) || '0'}%
            </div>
            <p className="text-xs text-muted-foreground">Retorno sobre investimento</p>
          </CardContent>
        </Card>
      </div>

      {/* Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tendências de Uso de Cupons (Últimos 6 Meses)</CardTitle>
          <CardDescription>Análise temporal de uso e conversão de cupons</CardDescription>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="total_revenue" 
                  stroke="hsl(var(--primary))" 
                  name="Receita (R$)"
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="total_discount" 
                  stroke="hsl(var(--destructive))" 
                  name="Desconto (R$)"
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="conversion_rate" 
                  stroke="hsl(var(--secondary))" 
                  name="Taxa Conversão (%)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Coupons Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Top 10 by ROI */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Cupons por ROI</CardTitle>
            <CardDescription>Maior retorno sobre investimento</CardDescription>
          </CardHeader>
          <CardContent>
            {roiLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topROI?.slice(0, 10) || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="code" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="roi" fill="hsl(var(--primary))" name="ROI (%)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top 10 by Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Cupons por Receita</CardTitle>
            <CardDescription>Maior receita gerada</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topRevenue?.slice(0, 10) || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="code" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(var(--secondary))" name="Receita (R$)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top 10 by Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Cupons por Uso</CardTitle>
            <CardDescription>Mais utilizados pelos clientes</CardDescription>
          </CardHeader>
          <CardContent>
            {usageLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topUsage?.slice(0, 10) || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="code" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="hsl(var(--accent))" name="Pedidos" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion and Abandonment Analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Conversion Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Conversão por Cupom</CardTitle>
            <CardDescription>% de cupons aplicados que viraram vendas</CardDescription>
          </CardHeader>
          <CardContent>
            {conversionLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {conversionRates?.slice(0, 15).map((coupon: any) => (
                  <div key={coupon.code} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="font-mono text-sm">{coupon.code}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {coupon.orders_completed}/{coupon.orders_attempted}
                      </span>
                      <span className="font-semibold text-sm">
                        {coupon.conversion_rate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Abandonment Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Análise de Abandono</CardTitle>
            <CardDescription>Cupons aplicados mas não finalizados</CardDescription>
          </CardHeader>
          <CardContent>
            {abandonmentLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {abandonmentData?.filter((item: any) => item.abandoned > 0).slice(0, 15).map((item: any) => (
                  <div key={item.code} className="flex items-center justify-between p-2 rounded-lg bg-destructive/10">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="font-mono text-sm">{item.code}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {item.abandoned} abandonos
                      </span>
                      <span className="font-semibold text-sm text-destructive">
                        {item.abandonmentRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CAC Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Custo de Aquisição de Cliente (CAC) por Cupom</CardTitle>
          <CardDescription>
            Quanto foi investido em desconto para adquirir cada novo cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cacLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {cacData?.filter(item => item.new_customers > 0).map((item) => (
                <div key={item.code} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <span className="font-mono text-sm font-semibold">{item.code}</span>
                      <p className="text-xs text-muted-foreground">
                        {item.new_customers} novos clientes de {item.total_customers} total
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      R$ {item.cac.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      CAC / novo cliente
                    </p>
                  </div>
                </div>
              ))}
              {(!cacData || cacData.filter(item => item.new_customers > 0).length === 0) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Sem dados</AlertTitle>
                  <AlertDescription>
                    Nenhum cupom foi usado para aquisição de novos clientes ainda.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recomendações</CardTitle>
          <CardDescription>Análise automática baseada nos dados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics && metrics.averageRoi < 50 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>ROI Baixo Detectado</AlertTitle>
                <AlertDescription>
                  O ROI médio está abaixo de 50%. Considere revisar os valores de desconto ou implementar cupons mais segmentados.
                </AlertDescription>
              </Alert>
            )}
            
            {metrics && metrics.averageConversionRate < 30 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Taxa de Conversão Baixa</AlertTitle>
                <AlertDescription>
                  Muitos cupons aplicados não se convertem em vendas ({metrics.averageConversionRate.toFixed(1)}%). 
                  Revise os requisitos mínimos de valor ou simplifique o processo de checkout.
                </AlertDescription>
              </Alert>
            )}

            {topROI && topROI.length > 0 && topROI[0].roi > 200 && (
              <Alert className="border-primary">
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>Cupom de Alto Desempenho</AlertTitle>
                <AlertDescription>
                  O cupom "{topROI[0].code}" tem ROI excepcional de {topROI[0].roi.toFixed(0)}%. 
                  Considere criar campanhas similares ou estender sua duração.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingDashboard;
