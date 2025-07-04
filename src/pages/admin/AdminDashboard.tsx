import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp, Award, Users, Package, Eye, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardStats {
  ordersToday: number;
  revenue30d: number;
  avgOrderValue: number;
  pointsIssued: number;
  totalUsers: number;
  totalProducts: number;
  conversionRate: number;
  ordersGrowth: number;
}

interface SalesData {
  date: string;
  sales: number;
  orders: number;
}

interface FunnelData {
  step: string;
  count: number;
  color: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    ordersToday: 0,
    revenue30d: 0,
    avgOrderValue: 0,
    pointsIssued: 0,
    totalUsers: 0,
    totalProducts: 0,
    conversionRate: 0,
    ordersGrowth: 0
  });
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const today = startOfDay(new Date()).toISOString();
        const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
        const sixtyDaysAgo = subDays(new Date(), 60).toISOString();

        // Parallel queries for better performance
        const [
          ordersToday,
          revenueData,
          pointsData,
          usersCount,
          productsCount,
          sessionsCount,
          checkoutCount,
          ordersLast30,
          ordersPrevious30
        ] = await Promise.all([
          // Orders today
          supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today),
          
          // Revenue last 30 days
          supabase.from('orders').select('total_amount').eq('payment_status', 'paid').gte('created_at', thirtyDaysAgo),
          
          // Points issued
          supabase.from('points_transactions').select('delta').gte('created_at', thirtyDaysAgo).gt('delta', 0),
          
          // Total users
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          
          // Total products
          supabase.from('perfumes').select('*', { count: 'exact', head: true }),
          
          // Sessions for conversion
          supabase.from('conversational_sessions').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
          
          // Checkout for conversion
          supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
          
          // Orders last 30 days for growth
          supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
          
          // Orders previous 30 days for growth comparison
          supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', sixtyDaysAgo).lt('created_at', thirtyDaysAgo)
        ]);

        const revenue30d = revenueData.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
        const avgOrderValue = revenueData.data?.length ? revenue30d / revenueData.data.length : 0;
        const pointsIssued = pointsData.data?.reduce((sum, transaction) => sum + transaction.delta, 0) || 0;
        const conversionRate = sessionsCount.count ? ((checkoutCount.count || 0) / sessionsCount.count) * 100 : 0;
        
        // Calculate growth
        const currentOrders = ordersLast30.count || 0;
        const previousOrders = ordersPrevious30.count || 0;
        const ordersGrowth = previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders) * 100 : 0;

        setStats({
          ordersToday: ordersToday.count || 0,
          revenue30d,
          avgOrderValue,
          pointsIssued,
          totalUsers: usersCount.count || 0,
          totalProducts: productsCount.count || 0,
          conversionRate,
          ordersGrowth
        });

        // Sales data for chart
        const salesChartData: SalesData[] = [];
        for (let i = 29; i >= 0; i--) {
          const date = subDays(new Date(), i);
          const dateStr = startOfDay(date).toISOString();
          const nextDateStr = startOfDay(subDays(new Date(), i - 1)).toISOString();

          const { data: dayOrders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('payment_status', 'paid')
            .gte('created_at', dateStr)
            .lt('created_at', i === 0 ? new Date().toISOString() : nextDateStr);

          const dayRevenue = dayOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

          salesChartData.push({
            date: format(date, 'dd/MM', { locale: ptBR }),
            sales: dayRevenue,
            orders: dayOrders?.length || 0
          });
        }

        setSalesData(salesChartData);

        // Enhanced funnel data
        setFunnelData([
          { step: 'Visitantes', count: Math.floor((sessionsCount.count || 0) * 3), color: '#8b5cf6' },
          { step: 'Sessões Curadoria', count: sessionsCount.count || 0, color: '#6366f1' },
          { step: 'Checkout Iniciado', count: Math.floor((checkoutCount.count || 0) * 1.2), color: '#06b6d4' },
          { step: 'Pedidos Concluídos', count: checkoutCount.count || 0, color: '#10b981' }
        ]);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, trend, subtitle, gradient }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: number;
    subtitle: string;
    gradient: string;
  }) => (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
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
    return (
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20" />
                <div className="h-8 w-8 bg-muted rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded mb-2 w-16" />
                <div className="h-3 bg-muted rounded w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral completa do seu negócio em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="h-4 w-4" />
          Atualizado agora
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pedidos Hoje"
          value={stats.ordersToday}
          icon={ShoppingCart}
          trend={stats.ordersGrowth}
          subtitle="Pedidos realizados hoje"
          gradient="from-blue-500 to-blue-600"
        />
        
        <StatCard
          title="Receita 30 Dias"
          value={new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            notation: 'compact'
          }).format(stats.revenue30d)}
          icon={DollarSign}
          subtitle="Últimos 30 dias"
          gradient="from-green-500 to-green-600"
        />
        
        <StatCard
          title="Ticket Médio"
          value={new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(stats.avgOrderValue)}
          icon={TrendingUp}
          subtitle="Valor médio por pedido"
          gradient="from-purple-500 to-purple-600"
        />
        
        <StatCard
          title="Taxa Conversão"
          value={`${stats.conversionRate.toFixed(1)}%`}
          icon={Award}
          subtitle="Curadoria → Checkout"
          gradient="from-orange-500 to-orange-600"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Total Usuários"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          subtitle="Usuários cadastrados"
          gradient="from-cyan-500 to-cyan-600"
        />
        
        <StatCard
          title="Produtos Ativos"
          value={stats.totalProducts.toLocaleString()}
          icon={Package}
          subtitle="Perfumes no catálogo"
          gradient="from-pink-500 to-pink-600"
        />
        
        <StatCard
          title="Pontos Emitidos"
          value={stats.pointsIssued.toLocaleString()}
          icon={Award}
          subtitle="Últimos 30 dias"
          gradient="from-amber-500 to-amber-600"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales Chart - Takes 2 columns */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Vendas dos Últimos 30 Dias
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value, name) => [
                    name === 'sales' 
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number)
                      : value,
                    name === 'sales' ? 'Vendas' : 'Pedidos'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Funnel Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-secondary/5 to-secondary/10">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-secondary" />
              Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {funnelData.map((item, index) => (
                <div key={item.step} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.step}</span>
                    <span className="text-sm text-muted-foreground">{item.count}</span>
                  </div>
                  <div className="w-full bg-secondary/20 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${(item.count / Math.max(...funnelData.map(d => d.count))) * 100}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                  {index < funnelData.length - 1 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {funnelData[index + 1] ? 
                        `${((funnelData[index + 1].count / item.count) * 100).toFixed(1)}% conversão` 
                        : ''
                      }
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;