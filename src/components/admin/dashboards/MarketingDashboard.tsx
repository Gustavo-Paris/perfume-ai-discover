import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, DollarSign, Percent, Users, ShoppingCart, AlertCircle, Tag, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DashboardSelector, DashboardType } from '@/components/admin/DashboardSelector';

interface MarketingDashboardProps {
  currentDashboard: DashboardType;
  setCurrentDashboard: (dashboard: DashboardType) => void;
}

const MarketingDashboard = ({ currentDashboard, setCurrentDashboard }: MarketingDashboardProps) => {
  const { data: metrics, isLoading: metricsLoading } = useMarketingMetrics();
  const { data: trends, isLoading: trendsLoading } = useMarketingTrends(6);
  const { data: topROI, isLoading: roiLoading } = useTopCouponsByROI(10);
  const { data: topRevenue, isLoading: revenueLoading } = useTopCouponsByRevenue(10);
  const { data: topUsage, isLoading: usageLoading } = useTopCouponsByUsage(10);
  const { data: conversionRates, isLoading: conversionLoading } = useCouponConversionRates();
  const { data: abandonmentData, isLoading: abandonmentLoading } = useCouponAbandonmentAnalysis();
  const { data: cacData, isLoading: cacLoading } = useCACByCoupon();

  const StatCard = ({ title, value, icon: Icon, trend, subtitle, gradient }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: number;
    subtitle: string;
    gradient: string;
  }) => (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-full bg-gradient-to-br ${gradient}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground flex-1">{subtitle}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (metricsLoading) {
    return <div className="text-center p-8">Carregando dados de marketing...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard de Marketing & Cupons</h2>
          <p className="text-muted-foreground">Análise completa de performance de cupons e estratégias de marketing</p>
        </div>
        <DashboardSelector value={currentDashboard} onChange={setCurrentDashboard} />
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Cupons Ativos"
          value={metrics?.totalCouponsActive || 0}
          icon={Tag}
          subtitle="Cupons disponíveis para uso"
          gradient="from-blue-500 to-blue-600"
        />

        <StatCard
          title="Desconto Total Concedido"
          value={new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            notation: 'compact'
          }).format(metrics?.totalDiscountGiven || 0)}
          icon={DollarSign}
          subtitle="Total investido em descontos"
          gradient="from-red-500 to-red-600"
        />

        <StatCard
          title="Receita Gerada"
          value={new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            notation: 'compact'
          }).format(metrics?.totalRevenueFromCoupons || 0)}
          icon={TrendingUp}
          subtitle="Receita total com cupons"
          gradient="from-green-500 to-green-600"
        />

        <StatCard
          title="ROI Médio"
          value={`${metrics?.averageRoi?.toFixed(1) || '0.0'}%`}
          icon={Percent}
          subtitle="Retorno sobre investimento"
          gradient="from-purple-500 to-purple-600"
        />
      </div>

      {/* Trends Chart */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tendências de Uso de Cupons (Últimos 6 Meses)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {trendsLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
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
                  stroke="#ef4444" 
                  name="Desconto (R$)"
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="conversion_rate" 
                  stroke="#10b981" 
                  name="Taxa Conversão (%)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Coupons Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top 10 by ROI */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-purple-100">
            <CardTitle>Top 10 Cupons por ROI</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {roiLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topROI?.slice(0, 10) || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="code" type="category" width={80} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="roi" fill="#8b5cf6" name="ROI (%)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top 10 by Revenue */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-green-50 to-green-100">
            <CardTitle>Top 10 Cupons por Receita</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {revenueLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topRevenue?.slice(0, 10) || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="code" type="category" width={80} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" name="Receita (R$)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top 10 by Usage */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle>Top 10 Cupons por Uso</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {usageLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topUsage?.slice(0, 10) || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="code" type="category" width={80} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="orders" fill="#06b6d4" name="Pedidos" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion and Abandonment Analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conversion Rates */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-secondary/5 to-secondary/10">
            <CardTitle>Taxa de Conversão por Cupom</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
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
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-red-50 to-red-100">
            <CardTitle>Análise de Abandono</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
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
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-cyan-50 to-cyan-100">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-600" />
            Custo de Aquisição de Cliente (CAC) por Cupom
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
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
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-amber-100">
          <CardTitle>Insights & Recomendações</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
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
