import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { subDays } from 'date-fns';
import { DashboardHeader } from '@/components/admin/DashboardHeader';
import type { DateRange } from '@/components/admin/DateRangeFilter';
import { 
  useTopProductsByRevenue, 
  useTopProductsByQuantity,
  useTopProductsByMargin,
  useCrossSellAnalysis,
  useABCAnalysis,
  useBCGMatrix,
  useDeadProducts
} from '@/hooks/useProductAnalytics';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { TrendingUp, Package, DollarSign, Percent, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DashboardSelector, DashboardType } from '@/components/admin/DashboardSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProductsDashboardProps {
  currentDashboard: DashboardType;
  setCurrentDashboard: (dashboard: DashboardType) => void;
}

const ProductsDashboard = ({ currentDashboard, setCurrentDashboard }: ProductsDashboardProps) => {
  const [dateRange] = useState<DateRange>({
    from: subDays(new Date(), 29),
    to: new Date()
  });

  const { data: topByRevenue, isLoading: revenueLoading, refetch: refetchRevenue } = useTopProductsByRevenue(10);
  const { data: topByQuantity, isLoading: quantityLoading, refetch: refetchQuantity } = useTopProductsByQuantity(10);
  const { data: topByMargin, isLoading: marginLoading, refetch: refetchMargin } = useTopProductsByMargin(10);
  const { data: crossSell, isLoading: crossSellLoading, refetch: refetchCrossSell } = useCrossSellAnalysis(15);
  const { data: abcData, isLoading: abcLoading, refetch: refetchABC } = useABCAnalysis();
  const { data: bcgData, isLoading: bcgLoading, refetch: refetchBCG } = useBCGMatrix();
  const { data: deadProducts, isLoading: deadLoading, refetch: refetchDead } = useDeadProducts(60);

  const loading = revenueLoading || quantityLoading || marginLoading;

  // Calcular métricas agregadas
  const totalProducts = topByRevenue?.length || 0;
  const totalRevenue = topByRevenue?.reduce((sum, p) => sum + p.total_revenue, 0) || 0;
  const avgMargin = topByRevenue?.reduce((sum, p) => sum + p.margin_percentage, 0) / Math.max(totalProducts, 1) || 0;

  // Classificação ABC
  const abcCounts = {
    A: abcData?.filter(p => p.class === 'A').length || 0,
    B: abcData?.filter(p => p.class === 'B').length || 0,
    C: abcData?.filter(p => p.class === 'C').length || 0,
  };

  // Cores para BCG Matrix
  const bcgColors = {
    star: '#10b981',
    cash_cow: '#06b6d4',
    question_mark: '#f59e0b',
    dog: '#ef4444'
  };

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

  if (loading) {
    return <div className="text-center p-8">Carregando análise de produtos...</div>;
  }

  const exportData = topByRevenue?.map(item => ({
    'Produto': item.name,
    'Receita': item.total_revenue,
    'Quantidade': item.total_quantity,
    'Margem (%)': item.margin_percentage
  })) || [];

  const handleRefresh = () => {
    refetchRevenue();
    refetchQuantity();
    refetchMargin();
    refetchCrossSell();
    refetchABC();
    refetchBCG();
    refetchDead();
  };

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Análise de Produtos"
        description="Performance detalhada e insights de vendas por produto"
        currentDashboard={currentDashboard}
        setCurrentDashboard={setCurrentDashboard}
        dateRange={dateRange}
        onDateRangeChange={() => {}}
        exportData={exportData}
        exportFilename="produtos"
        exportTitle="Relatório de Produtos"
        onRefresh={handleRefresh}
        showDateFilter={false}
      />

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Produtos"
          value={totalProducts}
          icon={Package}
          subtitle="Produtos com vendas"
          gradient="from-blue-500 to-blue-600"
        />

        <StatCard
          title="Receita Total"
          value={new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            notation: 'compact'
          }).format(totalRevenue)}
          icon={DollarSign}
          subtitle="Vendas acumuladas"
          gradient="from-green-500 to-green-600"
        />

        <StatCard
          title="Margem Média"
          value={`${avgMargin.toFixed(1)}%`}
          icon={Percent}
          subtitle="Lucro médio por produto"
          gradient="from-purple-500 to-purple-600"
        />

        <StatCard
          title="Produtos Classe A"
          value={abcCounts.A}
          icon={TrendingUp}
          subtitle="80% da receita"
          gradient="from-orange-500 to-orange-600"
        />
      </div>

      {/* Tabs para diferentes análises */}
      <Tabs defaultValue="top-sellers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="top-sellers">Top Vendas</TabsTrigger>
          <TabsTrigger value="margins">Margens</TabsTrigger>
          <TabsTrigger value="analysis">Análises</TabsTrigger>
          <TabsTrigger value="cross-sell">Cross-Sell</TabsTrigger>
        </TabsList>

        {/* Top Sellers */}
        <TabsContent value="top-sellers" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Por Receita */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-gradient-to-r from-green-50 to-green-100">
                <CardTitle>Top 10 por Receita</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topByRevenue?.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="name" type="category" width={120} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => [
                        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                        'Receita'
                      ]}
                    />
                    <Bar dataKey="total_revenue" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Por Quantidade */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100">
                <CardTitle>Top 10 por Quantidade</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topByQuantity?.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="name" type="category" width={120} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="total_quantity" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Margins */}
        <TabsContent value="margins" className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-purple-100">
              <CardTitle>Top 15 por Margem de Lucro</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={topByMargin?.slice(0, 15)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="name" type="category" width={150} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => [`${value.toFixed(1)}%`, 'Margem']}
                  />
                  <Bar dataKey="margin_percentage" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis (ABC + BCG) */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Análise ABC */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-amber-100">
                <CardTitle>Análise ABC</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Classe A (80% receita)', value: abcCounts.A, fill: '#10b981' },
                        { name: 'Classe B (15% receita)', value: abcCounts.B, fill: '#f59e0b' },
                        { name: 'Classe C (5% receita)', value: abcCounts.C, fill: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name.split(' ')[1]}: ${value}`}
                      outerRadius={80}
                      dataKey="value"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    <strong className="text-green-600">Classe A:</strong> Poucos produtos, alta receita (prioridade máxima)
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="text-orange-600">Classe B:</strong> Receita média, manter estoque
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="text-red-600">Classe C:</strong> Muitos produtos, baixa receita individual
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Matriz BCG */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-gradient-to-r from-cyan-50 to-cyan-100">
                <CardTitle>Matriz BCG</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {bcgLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        type="number" 
                        dataKey="market_share" 
                        name="Participação" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="growth_rate" 
                        name="Crescimento"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <ZAxis type="number" dataKey="revenue" range={[100, 1000]} />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: any, name: string) => {
                          if (name === 'market_share') return [`${value.toFixed(1)}%`, 'Participação'];
                          if (name === 'growth_rate') return [`${value.toFixed(1)}%`, 'Crescimento'];
                          return value;
                        }}
                      />
                      <Scatter name="Produtos" data={bcgData}>
                        {bcgData?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={bcgColors[entry.category]} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Estrela (alto crescimento)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-500" />
                    <span>Vaca Leiteira (estável)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span>Interrogação (potencial)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Abacaxi (baixo desempenho)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cross-Sell */}
        <TabsContent value="cross-sell" className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-r from-pink-50 to-pink-100">
              <CardTitle>Produtos Frequentemente Comprados Juntos</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {crossSellLoading ? (
                <Skeleton className="h-96 w-full" />
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {crossSell?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span>{item.product_1_name}</span>
                          <span className="text-muted-foreground">+</span>
                          <span>{item.product_2_name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Correlação: {(item.correlation_score * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">{item.times_bought_together}x</div>
                        <p className="text-xs text-muted-foreground">comprados juntos</p>
                      </div>
                    </div>
                  ))}
                  {(!crossSell || crossSell.length === 0) && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Sem dados</AlertTitle>
                      <AlertDescription>
                        Ainda não há dados suficientes de compras conjuntas.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Produtos "Mortos" Alert */}
      {deadProducts && deadProducts.length > 0 && (
        <Alert className="border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Produtos sem Vendas (60+ dias)</AlertTitle>
          <AlertDescription>
            {deadProducts.length} produtos não tiveram vendas nos últimos 60 dias. 
            Considere criar promoções ou descontinuar itens com baixo giro.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ProductsDashboard;
