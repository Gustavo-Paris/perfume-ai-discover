import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ShoppingCart, Clock, CheckCircle, XCircle, Package, TrendingUp, Users } from 'lucide-react';
import { format, subDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardSelector, DashboardType } from '@/components/admin/DashboardSelector';
import { DashboardHeader } from '@/components/admin/DashboardHeader';
import type { DateRange } from '@/components/admin/DateRangeFilter';
import { 
  useOrdersOverview, 
  useOrdersByStatus, 
  useOrdersByPeriod,
  useTopCustomers,
  useOrderFulfillmentMetrics 
} from '@/hooks/useOrdersAnalytics';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const OrdersDashboard = ({ currentDashboard, setCurrentDashboard }: {
  currentDashboard: DashboardType;
  setCurrentDashboard: (dashboard: DashboardType) => void;
}) => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 29),
    to: new Date()
  });

  const days = differenceInDays(dateRange.to, dateRange.from);
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useOrdersOverview(days);
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useOrdersByStatus(days);
  const { data: periodData, isLoading: periodLoading, refetch: refetchPeriod } = useOrdersByPeriod(days);
  const { data: topCustomers, isLoading: customersLoading, refetch: refetchCustomers } = useTopCustomers(5);
  const { data: fulfillmentMetrics, refetch: refetchFulfillment } = useOrderFulfillmentMetrics(days);

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

  if (overviewLoading || statusLoading || periodLoading) {
    return <div className="text-center p-8">Carregando dados de pedidos...</div>;
  }

  const chartData = periodData?.map(item => ({
    date: format(new Date(item.period), 'dd/MM', { locale: ptBR }),
    total: item.total_orders,
    completed: item.completed_orders,
    cancelled: item.cancelled_orders,
    revenue: item.total_revenue
  })) || [];

  const statusChartData = statusData?.map(item => ({
    status: item.status,
    count: item.count,
    value: item.total_value
  })) || [];

  const exportData = chartData.map(item => ({
    Data: item.date,
    'Total de Pedidos': item.total,
    'Concluídos': item.completed,
    'Cancelados': item.cancelled,
    'Receita': item.revenue
  }));

  const handleRefresh = () => {
    refetchOverview();
    refetchStatus();
    refetchPeriod();
    refetchCustomers();
    refetchFulfillment();
  };

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Dashboard de Pedidos"
        description="Análise detalhada do fluxo de pedidos"
        currentDashboard={currentDashboard}
        setCurrentDashboard={setCurrentDashboard}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        exportData={exportData}
        exportFilename="pedidos"
        exportTitle="Relatório de Pedidos"
        onRefresh={handleRefresh}
      />

      {/* Order Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total de Pedidos"
          value={overview?.total_orders || 0}
          icon={ShoppingCart}
          subtitle="Últimos 30 dias"
          gradient="from-blue-500 to-blue-600"
        />
        
        <StatCard
          title="Pendentes"
          value={overview?.pending_orders || 0}
          icon={Clock}
          subtitle="Aguardando processamento"
          gradient="from-yellow-500 to-yellow-600"
        />
        
        <StatCard
          title="Concluídos"
          value={overview?.completed_orders || 0}
          icon={CheckCircle}
          subtitle="Pedidos finalizados"
          gradient="from-green-500 to-green-600"
        />
        
        <StatCard
          title="Cancelados"
          value={overview?.cancelled_orders || 0}
          icon={XCircle}
          subtitle="Pedidos cancelados"
          gradient="from-red-500 to-red-600"
        />
        
        <StatCard
          title="Receita Total"
          value={new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL',
            notation: 'compact'
          }).format(overview?.total_revenue || 0)}
          icon={TrendingUp}
          subtitle="Últimos 30 dias"
          gradient="from-purple-500 to-purple-600"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
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
                  dataKey="total" 
                  stroke="#06b6d4" 
                  strokeWidth={3}
                  name="Total"
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Concluídos"
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
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="status" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
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
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Fulfillment Metrics */}
      {fulfillmentMetrics && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tempo de Processamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {fulfillmentMetrics.avg_processing_time_hours.toFixed(1)}h
              </div>
              <p className="text-xs text-muted-foreground">Média de processamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tempo de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {fulfillmentMetrics.avg_delivery_time_days.toFixed(1)} dias
              </div>
              <p className="text-xs text-muted-foreground">Média de entrega</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {fulfillmentMetrics.on_time_delivery_rate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Entregas no prazo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Enviado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {fulfillmentMetrics.total_shipped}
              </div>
              <p className="text-xs text-muted-foreground">Pedidos enviados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Customers */}
      {!customersLoading && topCustomers && topCustomers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Pedidos</TableHead>
                  <TableHead>Total Gasto</TableHead>
                  <TableHead>Ticket Médio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.map((customer) => (
                  <TableRow key={customer.user_id}>
                    <TableCell className="font-medium">{customer.user_name}</TableCell>
                    <TableCell>{customer.user_email}</TableCell>
                    <TableCell>{customer.total_orders}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(customer.total_spent)}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(customer.avg_order_value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrdersDashboard;
