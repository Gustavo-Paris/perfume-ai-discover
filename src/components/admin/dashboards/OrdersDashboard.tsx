import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ShoppingCart, Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  avgProcessingTime: number;
}

const OrdersDashboard = () => {
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    avgProcessingTime: 0
  });
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrdersData = async () => {
      try {
        const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

        // Get all orders from last 30 days
        const { data: orders } = await supabase
          .from('orders')
          .select('status, created_at, updated_at')
          .gte('created_at', thirtyDaysAgo);

        const totalOrders = orders?.length || 0;
        const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
        const completedOrders = orders?.filter(o => o.status === 'delivered').length || 0;
        const cancelledOrders = orders?.filter(o => o.status === 'cancelled').length || 0;

        // Calculate average processing time for completed orders
        const completedOrdersWithTime = orders?.filter(o => 
          o.status === 'delivered' && o.updated_at && o.created_at
        ) || [];
        
        const avgProcessingTime = completedOrdersWithTime.length > 0 
          ? completedOrdersWithTime.reduce((sum, order) => {
              const created = new Date(order.created_at);
              const updated = new Date(order.updated_at);
              return sum + (updated.getTime() - created.getTime());
            }, 0) / completedOrdersWithTime.length / (1000 * 60 * 60 * 24) // Convert to days
          : 0;

        setStats({
          totalOrders,
          pendingOrders,
          completedOrders,
          cancelledOrders,
          avgProcessingTime
        });

        // Orders by day
        const dailyOrders = new Map();
        for (let i = 29; i >= 0; i--) {
          const date = subDays(new Date(), i);
          const dateStr = format(date, 'yyyy-MM-dd');
          dailyOrders.set(dateStr, { 
            date: format(date, 'dd/MM', { locale: ptBR }), 
            orders: 0,
            completed: 0,
            cancelled: 0
          });
        }

        orders?.forEach(order => {
          const dateStr = format(new Date(order.created_at), 'yyyy-MM-dd');
          if (dailyOrders.has(dateStr)) {
            const dayData = dailyOrders.get(dateStr);
            dayData.orders += 1;
            if (order.status === 'delivered') dayData.completed += 1;
            if (order.status === 'cancelled') dayData.cancelled += 1;
          }
        });

        setOrdersData(Array.from(dailyOrders.values()));

        // Status distribution
        const statusCounts = [
          { status: 'Pendente', count: pendingOrders, color: '#f59e0b' },
          { status: 'Pago', count: orders?.filter(o => o.status === 'paid').length || 0, color: '#06b6d4' },
          { status: 'Enviado', count: orders?.filter(o => o.status === 'shipped').length || 0, color: '#8b5cf6' },
          { status: 'Entregue', count: completedOrders, color: '#10b981' },
          { status: 'Cancelado', count: cancelledOrders, color: '#ef4444' }
        ];

        setStatusData(statusCounts.filter(s => s.count > 0));
      } catch (error) {
        console.error('Error fetching orders data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrdersData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, subtitle, gradient }: {
    title: string;
    value: string | number;
    icon: any;
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
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="text-center p-8">Carregando dados de pedidos...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard de Pedidos</h2>
        <p className="text-muted-foreground">Análise detalhada do fluxo de pedidos</p>
      </div>

      {/* Order Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total de Pedidos"
          value={stats.totalOrders}
          icon={ShoppingCart}
          subtitle="Últimos 30 dias"
          gradient="from-blue-500 to-blue-600"
        />
        
        <StatCard
          title="Pendentes"
          value={stats.pendingOrders}
          icon={Clock}
          subtitle="Aguardando processamento"
          gradient="from-yellow-500 to-yellow-600"
        />
        
        <StatCard
          title="Entregues"
          value={stats.completedOrders}
          icon={CheckCircle}
          subtitle="Pedidos finalizados"
          gradient="from-green-500 to-green-600"
        />
        
        <StatCard
          title="Cancelados"
          value={stats.cancelledOrders}
          icon={XCircle}
          subtitle="Pedidos cancelados"
          gradient="from-red-500 to-red-600"
        />
        
        <StatCard
          title="Tempo Médio"
          value={`${stats.avgProcessingTime.toFixed(1)} dias`}
          icon={Package}
          subtitle="Processamento"
          gradient="from-purple-500 to-purple-600"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Orders Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pedidos por Dia - Últimos 30 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#06b6d4" 
                  strokeWidth={3}
                  name="Total"
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Entregues"
                />
                <Line 
                  type="monotone" 
                  dataKey="cancelled" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Cancelados"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis 
                  type="category" 
                  dataKey="status" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  width={70}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#06b6d4"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrdersDashboard;