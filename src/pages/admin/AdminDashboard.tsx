import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardStats {
  ordersToday: number;
  revenue30d: number;
  avgOrderValue: number;
  pointsIssued: number;
}

interface SalesData {
  date: string;
  sales: number;
  orders: number;
}

interface FunnelData {
  step: string;
  count: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    ordersToday: 0,
    revenue30d: 0,
    avgOrderValue: 0,
    pointsIssued: 0
  });
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Stats queries
        const today = startOfDay(new Date()).toISOString();
        const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

        // Orders today
        const { count: ordersToday } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today);

        // Revenue last 30 days
        const { data: revenueData } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('payment_status', 'paid')
          .gte('created_at', thirtyDaysAgo);

        const revenue30d = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
        const avgOrderValue = revenueData?.length ? revenue30d / revenueData.length : 0;

        // Points issued (last 30 days)
        const { data: pointsData } = await supabase
          .from('points_transactions')
          .select('delta')
          .gte('created_at', thirtyDaysAgo)
          .gt('delta', 0);

        const pointsIssued = pointsData?.reduce((sum, transaction) => sum + transaction.delta, 0) || 0;

        setStats({
          ordersToday: ordersToday || 0,
          revenue30d,
          avgOrderValue,
          pointsIssued
        });

        // Sales data for chart (last 30 days)
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

        // Funnel data (mock data for now)
        const { count: sessionsCount } = await supabase
          .from('conversational_sessions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo);

        const { count: checkoutCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo);

        setFunnelData([
          { step: 'Sessões Curadoria', count: sessionsCount || 0 },
          { step: 'Checkout Iniciado', count: Math.floor((checkoutCount || 0) * 1.2) },
          { step: 'Pedidos Concluídos', count: checkoutCount || 0 }
        ]);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded animate-pulse w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu negócio
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Hoje</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ordersToday}</div>
            <p className="text-xs text-muted-foreground">
              Pedidos realizados hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita 30d</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(stats.revenue30d)}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(stats.avgOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor médio por pedido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Emitidos</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pointsIssued.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vendas dos Últimos 30 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'sales' 
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number)
                      : value,
                    name === 'sales' ? 'Vendas' : 'Pedidos'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funil de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="step" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;