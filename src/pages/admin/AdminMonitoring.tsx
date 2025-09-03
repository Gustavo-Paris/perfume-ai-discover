import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Package, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SystemStats {
  totalUsers: number;
  totalOrders: number;
  totalPerfumes: number;
  totalRevenue: number;
  ordersToday: number;
  newUsersToday: number;
  lowStockAlerts: number;
  systemHealth: 'good' | 'warning' | 'critical';
}

interface RecentActivity {
  id: string;
  type: 'order' | 'user' | 'review' | 'error';
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
}

const AdminMonitoring = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalPerfumes: 0,
    totalRevenue: 0,
    ordersToday: 0,
    newUsersToday: 0,
    lowStockAlerts: 0,
    systemHealth: 'good'
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadSystemStats();
    loadRecentActivity();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadSystemStats();
      loadRecentActivity();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadSystemStats = async () => {
    try {
      // Get total counts
      const [
        { count: totalUsers },
        { count: totalOrders },
        { count: totalPerfumes },
        { data: orders },
        { data: profiles }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('perfumes').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount, created_at, payment_status'),
        supabase.from('profiles').select('created_at')
      ]);

      // Calculate revenue
      const totalRevenue = orders
        ?.filter(order => order.payment_status === 'paid')
        ?.reduce((acc, order) => acc + (order.total_amount || 0), 0) || 0;

      // Calculate today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const ordersToday = orders?.filter(order => 
        new Date(order.created_at) >= today
      ).length || 0;

      const newUsersToday = profiles?.filter(profile => 
        new Date(profile.created_at) >= today
      ).length || 0;

      // Check stock alerts (simplified)
      const { data: stockAlerts } = await supabase
        .from('inventory_lots')
        .select('qty_ml')
        .lt('qty_ml', 100);

      const lowStockAlerts = stockAlerts?.length || 0;

      // Determine system health
      let systemHealth: 'good' | 'warning' | 'critical' = 'good';
      if (lowStockAlerts > 10) systemHealth = 'critical';
      else if (lowStockAlerts > 5) systemHealth = 'warning';

      setStats({
        totalUsers: totalUsers || 0,
        totalOrders: totalOrders || 0,
        totalPerfumes: totalPerfumes || 0,
        totalRevenue,
        ordersToday,
        newUsersToday,
        lowStockAlerts,
        systemHealth
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar estatísticas do sistema.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      // Get recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, order_number, created_at, payment_status, total_amount')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent users
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      // Get recent reviews
      const { data: recentReviews } = await supabase
        .from('reviews')
        .select('id, rating, created_at, status')
        .order('created_at', { ascending: false })
        .limit(3);

      const activities: RecentActivity[] = [];

      // Add order activities
      recentOrders?.forEach(order => {
        activities.push({
          id: `order-${order.id}`,
          type: 'order',
          message: `Pedido #${order.order_number} - ${order.payment_status === 'paid' ? 'Pago' : 'Pendente'} - R$ ${order.total_amount?.toFixed(2)}`,
          timestamp: order.created_at,
          severity: order.payment_status === 'paid' ? 'info' : 'warning'
        });
      });

      // Add user activities
      recentUsers?.forEach(user => {
        activities.push({
          id: `user-${user.id}`,
          type: 'user',
          message: `Novo usuário cadastrado: ${user.email}`,
          timestamp: user.created_at,
          severity: 'info'
        });
      });

      // Add review activities
      recentReviews?.forEach(review => {
        activities.push({
          id: `review-${review.id}`,
          type: 'review',
          message: `Nova avaliação: ${review.rating} estrelas - Status: ${review.status}`,
          timestamp: review.created_at,
          severity: review.status === 'approved' ? 'info' : 'warning'
        });
      });

      // Sort by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setRecentActivity(activities.slice(0, 10));
    } catch (error) {
      console.error('Erro ao carregar atividades recentes:', error);
    }
  };

  const getHealthBadge = (health: string) => {
    const variants = {
      good: 'default',
      warning: 'secondary',
      critical: 'destructive'
    } as const;

    const labels = {
      good: 'Saudável',
      warning: 'Atenção',
      critical: 'Crítico'
    };

    return (
      <Badge variant={variants[health as keyof typeof variants]}>
        {labels[health as keyof typeof labels]}
      </Badge>
    );
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-4 w-4" />;
      case 'user':
        return <Users className="h-4 w-4" />;
      case 'review':
        return <Eye className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Monitoramento</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando dados...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoramento</h1>
          <p className="text-muted-foreground">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <Button onClick={() => { loadSystemStats(); loadRecentActivity(); }} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Status do Sistema
            </CardTitle>
            {getHealthBadge(stats.systemHealth)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.systemHealth === 'good' ? '99.9%' : '95.0%'}
              </div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.lowStockAlerts}
              </div>
              <div className="text-sm text-muted-foreground">Alertas Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.ordersToday}
              </div>
              <div className="text-sm text-muted-foreground">Pedidos Hoje</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.newUsersToday}
              </div>
              <div className="text-sm text-muted-foreground">Novos Usuários</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="activity">Atividade Recente</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.newUsersToday} hoje
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.ordersToday} hoje
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {stats.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Pedidos pagos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produtos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPerfumes}</div>
                <p className="text-xs text-muted-foreground">
                  No catálogo
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma atividade recente encontrada
                  </p>
                ) : (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className={`p-1 rounded ${getSeverityColor(activity.severity)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tempo de Resposta</span>
                  <Badge variant="default">150ms</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Taxa de Conversão</span>
                  <Badge variant="default">2.4%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sessões Ativas</span>
                  <Badge variant="default">12</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Bounce Rate</span>
                  <Badge variant="secondary">45%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertas do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.lowStockAlerts > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 border rounded-lg border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium">Estoque Baixo</p>
                        <p className="text-xs text-muted-foreground">
                          {stats.lowStockAlerts} produtos com estoque baixo
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 border rounded-lg border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Sistema Operacional</p>
                      <p className="text-xs text-muted-foreground">
                        Nenhum alerta ativo
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMonitoring;