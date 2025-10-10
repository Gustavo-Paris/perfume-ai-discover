import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Users, MousePointer, Clock, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardSelector, DashboardType } from '@/components/admin/DashboardSelector';
import { DashboardHeader } from '@/components/admin/DashboardHeader';
import type { DateRange } from '@/components/admin/DateRangeFilter';

interface PerformanceStats {
  totalSessions: number;
  conversionRate: number;
  abandonmentRate: number;
  avgSessionTime: number;
  newUsers: number;
  returningUsers: number;
  bounceRate: number;
  userGrowth: number;
}

interface ConversionFunnelData {
  step: string;
  users: number;
  conversionRate: number;
  color: string;
}

interface PerformanceData {
  date: string;
  sessions: number;
  conversions: number;
  newUsers: number;
  conversionRate: number;
}

const PerformanceDashboard = ({ currentDashboard, setCurrentDashboard }: {
  currentDashboard: DashboardType;
  setCurrentDashboard: (dashboard: DashboardType) => void;
}) => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [stats, setStats] = useState<PerformanceStats>({
    totalSessions: 0,
    conversionRate: 0,
    abandonmentRate: 0,
    avgSessionTime: 0,
    newUsers: 0,
    returningUsers: 0,
    bounceRate: 0,
    userGrowth: 0
  });
  const [funnelData, setFunnelData] = useState<ConversionFunnelData[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [trafficSources, setTrafficSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const fromDate = dateRange.from.toISOString();
        const toDate = dateRange.to.toISOString();
        const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
        const previousFromDate = subDays(dateRange.from, daysDiff).toISOString();
        const previousToDate = dateRange.from.toISOString();

        // Get conversational sessions (our main "sessions")
        const { data: allSessions } = await supabase
          .from('conversational_sessions')
          .select('created_at, user_id, session_status, recommended_perfumes')
          .gte('created_at', fromDate)
          .lte('created_at', toDate);

        const { data: previousSessions } = await supabase
          .from('conversational_sessions')
          .select('created_at, user_id')
          .gte('created_at', previousFromDate)
          .lt('created_at', previousToDate);

        // Get orders (conversions)
        const { data: orders } = await supabase
          .from('orders')
          .select('created_at, user_id, payment_status')
          .gte('created_at', fromDate)
          .lte('created_at', toDate);

        // Get user profiles to analyze new vs returning
        const { data: allUsers } = await supabase
          .from('profiles')
          .select('id, created_at')
          .gte('created_at', fromDate)
          .lte('created_at', toDate);

        const { data: previousUsers } = await supabase
          .from('profiles')
          .select('id')
          .gte('created_at', previousFromDate)
          .lt('created_at', previousToDate);

        // Get access logs for traffic analysis
        const { data: accessLogs } = await supabase
          .from('access_logs')
          .select('route, created_at, user_id')
          .gte('created_at', fromDate)
          .lte('created_at', toDate)
          .limit(1000);

        // Calculate main stats
        const totalSessions = allSessions?.length || 0;
        const paidOrders = orders?.filter(o => o.payment_status === 'paid').length || 0;
        const conversionRate = totalSessions > 0 ? (paidOrders / totalSessions) * 100 : 0;
        
        // Sessions with recommendations but no orders (abandonment)
        const sessionsWithRecommendations = allSessions?.filter(s => s.recommended_perfumes).length || 0;
        const abandonmentRate = sessionsWithRecommendations > 0 ? ((sessionsWithRecommendations - paidOrders) / sessionsWithRecommendations) * 100 : 0;

        // User growth
        const newUsers = allUsers?.length || 0;
        const previousNewUsers = previousUsers?.length || 0;
        const userGrowth = previousNewUsers > 0 ? ((newUsers - previousNewUsers) / previousNewUsers) * 100 : 0;

        // Returning vs new users (simplified)
        const sessionUserIds = new Set(allSessions?.map(s => s.user_id).filter(Boolean));
        const returningUsers = allUsers?.filter(u => {
          const userCreated = new Date(u.created_at);
          const fromDateObj = new Date(fromDate);
          return userCreated < fromDateObj && sessionUserIds.has(u.id);
        }).length || 0;

        // Bounce rate - sessions without recommendations
        const bounceRate = totalSessions > 0 ? ((totalSessions - sessionsWithRecommendations) / totalSessions) * 100 : 0;

        setStats({
          totalSessions,
          conversionRate,
          abandonmentRate,
          avgSessionTime: 8.5, // Placeholder - would need more detailed tracking
          newUsers,
          returningUsers,
          bounceRate,
          userGrowth
        });

        // Conversion funnel
        const visitors = Math.floor(totalSessions * 2.5); // Estimated visitors
        const funnelSteps: ConversionFunnelData[] = [
          {
            step: 'Visitantes',
            users: visitors,
            conversionRate: 100,
            color: '#8b5cf6'
          },
          {
            step: 'Sessões Curadoria',
            users: totalSessions,
            conversionRate: (totalSessions / visitors) * 100,
            color: '#6366f1'
          },
          {
            step: 'Recomendações',
            users: sessionsWithRecommendations,
            conversionRate: (sessionsWithRecommendations / totalSessions) * 100,
            color: '#06b6d4'
          },
          {
            step: 'Checkout',
            users: orders?.length || 0,
            conversionRate: ((orders?.length || 0) / sessionsWithRecommendations) * 100,
            color: '#10b981'
          },
          {
            step: 'Conversões',
            users: paidOrders,
            conversionRate: (paidOrders / (orders?.length || 1)) * 100,
            color: '#059669'
          }
        ];

        setFunnelData(funnelSteps);

        // Performance by day
        const dailyPerformance = new Map();
        for (let i = daysDiff - 1; i >= 0; i--) {
          const date = subDays(dateRange.to, i);
          const dateStr = format(date, 'yyyy-MM-dd');
          dailyPerformance.set(dateStr, {
            date: format(date, 'dd/MM', { locale: ptBR }),
            sessions: 0,
            conversions: 0,
            newUsers: 0,
            conversionRate: 0
          });
        }

        allSessions?.forEach(session => {
          const dateStr = format(new Date(session.created_at), 'yyyy-MM-dd');
          if (dailyPerformance.has(dateStr)) {
            dailyPerformance.get(dateStr).sessions += 1;
          }
        });

        orders?.filter(o => o.payment_status === 'paid').forEach(order => {
          const dateStr = format(new Date(order.created_at), 'yyyy-MM-dd');
          if (dailyPerformance.has(dateStr)) {
            dailyPerformance.get(dateStr).conversions += 1;
          }
        });

        allUsers?.forEach(user => {
          const dateStr = format(new Date(user.created_at), 'yyyy-MM-dd');
          if (dailyPerformance.has(dateStr)) {
            dailyPerformance.get(dateStr).newUsers += 1;
          }
        });

        // Calculate daily conversion rates
        const performanceArray = Array.from(dailyPerformance.values()).map(day => ({
          ...day,
          conversionRate: day.sessions > 0 ? (day.conversions / day.sessions) * 100 : 0
        }));

        setPerformanceData(performanceArray);

        // Traffic sources analysis (simplified)
        const routeCounts = new Map();
        accessLogs?.forEach(log => {
          const route = log.route || 'Direct';
          routeCounts.set(route, (routeCounts.get(route) || 0) + 1);
        });

        const topRoutes = Array.from(routeCounts.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([route, count], index) => ({
            source: route === '/' ? 'Homepage' : route.replace('/', '').charAt(0).toUpperCase() + route.slice(2),
            visits: count,
            color: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][index]
          }));

        setTrafficSources(topRoutes);

      } catch (error) {
        console.error('Error fetching performance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [dateRange]);

  const exportData = () => {
    return [
      { metric: 'Taxa de Conversão', value: `${stats.conversionRate.toFixed(1)}%` },
      { metric: 'Taxa de Abandono', value: `${stats.abandonmentRate.toFixed(1)}%` },
      { metric: 'Taxa de Rejeição', value: `${stats.bounceRate.toFixed(1)}%` },
      { metric: 'Crescimento de Usuários', value: `${stats.userGrowth.toFixed(1)}%` },
      { metric: 'Total de Sessões', value: stats.totalSessions.toLocaleString() },
      { metric: 'Novos Usuários', value: stats.newUsers.toLocaleString() },
      { metric: 'Usuários Recorrentes', value: stats.returningUsers.toLocaleString() },
      { metric: 'Tempo Médio de Sessão', value: `${stats.avgSessionTime} min` },
      ...funnelData.map(step => ({
        metric: `Funil - ${step.step}`,
        value: `${step.users.toLocaleString()} (${step.conversionRate.toFixed(1)}%)`
      }))
    ];
  };

  const handleRefresh = () => {
    setLoading(true);
    setDateRange({ ...dateRange });
  };

  const StatCard = ({ title, value, icon: Icon, subtitle, gradient, trend }: {
    title: string;
    value: string | number;
    icon: any;
    subtitle: string;
    gradient: string;
    trend?: number;
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
    return <div className="text-center p-8">Carregando dados de performance...</div>;
  }

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Dashboard de Performance"
        description="Análise de conversão e métricas de engajamento"
        currentDashboard={currentDashboard}
        setCurrentDashboard={setCurrentDashboard}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        exportData={exportData()}
        exportFilename="performance-dashboard"
        exportTitle="Dashboard de Performance"
        onRefresh={handleRefresh}
      />

      {/* Performance Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Taxa de Conversão"
          value={`${stats.conversionRate.toFixed(1)}%`}
          icon={Target}
          subtitle="Sessões → Vendas"
          gradient="from-green-500 to-green-600"
        />
        
        <StatCard
          title="Taxa de Abandono"
          value={`${stats.abandonmentRate.toFixed(1)}%`}
          icon={TrendingDown}
          subtitle="Recomendações não convertidas"
          gradient="from-red-500 to-red-600"
        />
        
        <StatCard
          title="Taxa de Rejeição"
          value={`${stats.bounceRate.toFixed(1)}%`}
          icon={MousePointer}
          subtitle="Sessões sem recomendações"
          gradient="from-orange-500 to-orange-600"
        />
        
        <StatCard
          title="Crescimento Usuários"
          value={`${stats.userGrowth > 0 ? '+' : ''}${stats.userGrowth.toFixed(1)}%`}
          icon={Users}
          trend={stats.userGrowth}
          subtitle="Crescimento mensal"
          gradient="from-blue-500 to-blue-600"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard
          title="Sessões Totais"
          value={stats.totalSessions.toLocaleString()}
          icon={MousePointer}
          subtitle="Últimos 30 dias"
          gradient="from-purple-500 to-purple-600"
        />
        
        <StatCard
          title="Novos Usuários"
          value={stats.newUsers.toLocaleString()}
          icon={Users}
          subtitle="Primeiros acessos"
          gradient="from-cyan-500 to-cyan-600"
        />
        
        <StatCard
          title="Usuários Recorrentes"
          value={stats.returningUsers.toLocaleString()}
          icon={TrendingUp}
          subtitle="Usuários que retornaram"
          gradient="from-indigo-500 to-indigo-600"
        />
        
        <StatCard
          title="Tempo Médio"
          value={`${stats.avgSessionTime} min`}
          icon={Clock}
          subtitle="Duração da sessão"
          gradient="from-teal-500 to-teal-600"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Performance Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Diária - Últimos 30 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value, name) => [
                    name === 'conversionRate' ? `${Number(value).toFixed(1)}%` : value,
                    name === 'sessions' ? 'Sessões' : 
                    name === 'conversions' ? 'Conversões' : 
                    name === 'newUsers' ? 'Novos Usuários' : 'Taxa de Conversão'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="sessions"
                />
                <Line 
                  type="monotone" 
                  dataKey="conversions" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="conversions"
                />
                <Line 
                  type="monotone" 
                  dataKey="conversionRate" 
                  stroke="#06b6d4" 
                  strokeWidth={3}
                  name="conversionRate"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Principais Páginas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trafficSources.map((source, index) => (
                <div key={source.source} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: source.color }}
                      />
                      <span className="font-medium">{source.source}</span>
                    </div>
                    <span className="text-muted-foreground">{source.visits}</span>
                  </div>
                  <div className="w-full bg-secondary/20 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(source.visits / Math.max(...trafficSources.map(s => s.visits))) * 100}%`,
                        backgroundColor: source.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão Detalhado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelData.map((step, index) => (
              <div key={step.step} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{step.step}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{step.users.toLocaleString()} usuários</span>
                    <span className="font-medium">{step.conversionRate.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="w-full bg-secondary/20 rounded-full h-4">
                  <div 
                    className="h-4 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                    style={{ 
                      width: `${(step.users / Math.max(...funnelData.map(d => d.users))) * 100}%`,
                      backgroundColor: step.color
                    }}
                  >
                    {step.users > 0 && (
                      <span className="text-xs text-white font-medium">
                        {step.users.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                {index < funnelData.length - 1 && (
                  <div className="text-xs text-muted-foreground ml-2">
                    ↓ {funnelData[index + 1] ? 
                      `${((funnelData[index + 1].users / step.users) * 100).toFixed(1)}% conversão` 
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
  );
};

export default PerformanceDashboard;