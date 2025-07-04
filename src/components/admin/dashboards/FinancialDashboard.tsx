import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardSelector, DashboardType } from '@/components/admin/DashboardSelector';

interface FinancialStats {
  totalRevenue: number;
  monthlyRevenue: number;
  avgOrderValue: number;
  refundRate: number;
  revenueGrowth: number;
}

interface PaymentMethodData {
  method: string;
  amount: number;
  count: number;
  color: string;
}

const FinancialDashboard = ({ currentDashboard, setCurrentDashboard }: {
  currentDashboard: DashboardType;
  setCurrentDashboard: (dashboard: DashboardType) => void;
}) => {
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    avgOrderValue: 0,
    refundRate: 0,
    revenueGrowth: 0
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
        const sixtyDaysAgo = subDays(new Date(), 60).toISOString();

        // Get all paid orders
        const { data: allOrders } = await supabase
          .from('orders')
          .select('total_amount, payment_method, created_at')
          .eq('payment_status', 'paid');

        const { data: currentMonthOrders } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('payment_status', 'paid')
          .gte('created_at', thirtyDaysAgo);

        const { data: previousMonthOrders } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('payment_status', 'paid')
          .gte('created_at', sixtyDaysAgo)
          .lt('created_at', thirtyDaysAgo);

        const totalRevenue = allOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
        const monthlyRevenue = currentMonthOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
        const previousRevenue = previousMonthOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
        const avgOrderValue = currentMonthOrders?.length ? monthlyRevenue / currentMonthOrders.length : 0;
        const revenueGrowth = previousRevenue > 0 ? ((monthlyRevenue - previousRevenue) / previousRevenue) * 100 : 0;

        setStats({
          totalRevenue,
          monthlyRevenue,
          avgOrderValue,
          refundRate: 2.5, // Placeholder
          revenueGrowth
        });

        // Revenue chart data - optimized single query
        const { data: revenueOrders } = await supabase
          .from('orders')
          .select('total_amount, created_at')
          .eq('payment_status', 'paid')
          .gte('created_at', thirtyDaysAgo)
          .order('created_at');

        // Group by day
        const dailyRevenue = new Map();
        for (let i = 29; i >= 0; i--) {
          const date = subDays(new Date(), i);
          const dateStr = format(date, 'yyyy-MM-dd');
          dailyRevenue.set(dateStr, { date: format(date, 'dd/MM', { locale: ptBR }), revenue: 0 });
        }

        revenueOrders?.forEach(order => {
          const dateStr = format(new Date(order.created_at), 'yyyy-MM-dd');
          if (dailyRevenue.has(dateStr)) {
            dailyRevenue.get(dateStr).revenue += order.total_amount;
          }
        });

        setRevenueData(Array.from(dailyRevenue.values()));

        // Payment methods data
        const methodCounts = new Map();
        allOrders?.forEach(order => {
          const method = order.payment_method || 'Outros';
          if (!methodCounts.has(method)) {
            methodCounts.set(method, { amount: 0, count: 0 });
          }
          methodCounts.get(method).amount += order.total_amount;
          methodCounts.get(method).count += 1;
        });

        const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
        const methodsData = Array.from(methodCounts.entries()).map(([method, data], index) => ({
          method,
          amount: data.amount,
          count: data.count,
          color: colors[index % colors.length]
        }));

        setPaymentMethods(methodsData);
      } catch (error) {
        console.error('Error fetching financial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

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
    return <div className="text-center p-8">Carregando dados financeiros...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h2>
          <p className="text-muted-foreground">Análise detalhada de receitas e pagamentos</p>
        </div>
        <DashboardSelector value={currentDashboard} onChange={setCurrentDashboard} />
      </div>

      {/* Financial Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Receita Total"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(stats.totalRevenue)}
          icon={DollarSign}
          subtitle="Receita acumulada"
          gradient="from-green-500 to-green-600"
        />
        
        <StatCard
          title="Receita 30 Dias"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(stats.monthlyRevenue)}
          icon={TrendingUp}
          trend={stats.revenueGrowth}
          subtitle="Últimos 30 dias"
          gradient="from-blue-500 to-blue-600"
        />
        
        <StatCard
          title="Ticket Médio"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.avgOrderValue)}
          icon={CreditCard}
          subtitle="Valor médio por pedido"
          gradient="from-purple-500 to-purple-600"
        />
        
        <StatCard
          title="Taxa de Reembolso"
          value={`${stats.refundRate}%`}
          icon={ArrowDownRight}
          subtitle="Pedidos reembolsados"
          gradient="from-orange-500 to-orange-600"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receita Diária - Últimos 30 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number),
                    'Receita'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="amount"
                  >
                    {paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [
                      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number),
                      'Total'
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <div key={method.method} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: method.color }}
                      />
                      <span>{method.method}</span>
                    </div>
                    <span className="font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(method.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialDashboard;