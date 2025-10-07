import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Search, TrendingUp, Users, DollarSign, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UserSubscription, SubscriptionPlan, SubscriptionStatus } from '@/types/subscription';

export default function AdminSubscriptions() {
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Buscar todas as assinaturas
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['admin-subscriptions', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (UserSubscription & { plan?: SubscriptionPlan })[];
    }
  });

  // Métricas
  const { data: metrics } = useQuery({
    queryKey: ['subscription-metrics'],
    queryFn: async () => {
      const { data: subs } = await supabase
        .from('user_subscriptions')
        .select('status, plan:subscription_plans(price_monthly)');

      const active = subs?.filter(s => s.status === 'active').length || 0;
      const mrr = subs
        ?.filter(s => s.status === 'active')
        .reduce((sum, s) => sum + (s.plan?.price_monthly || 0), 0) || 0;
      
      const { data: shipments } = await supabase
        .from('subscription_shipments')
        .select('id')
        .gte('month_year', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString());

      return {
        activeSubscriptions: active,
        totalSubscriptions: subs?.length || 0,
        mrr: mrr,
        shipmentsThisMonth: shipments?.length || 0
      };
    }
  });

  const filteredSubscriptions = subscriptions?.filter(sub => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return sub.plan?.name?.toLowerCase().includes(search);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Ativa</Badge>;
      case 'paused':
        return <Badge variant="secondary">Pausada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Pagamento Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Assinaturas</h1>
          <p className="text-muted-foreground">
            Visão geral e gerenciamento de todas as assinaturas
          </p>
        </div>

        {/* Métricas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Assinaturas Ativas
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.activeSubscriptions || 0}</div>
              <p className="text-xs text-muted-foreground">
                de {metrics?.totalSubscriptions || 0} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                MRR (Receita Recorrente)
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(metrics?.mrr || 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                por mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Envios Este Mês
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.shipmentsThisMonth || 0}</div>
              <p className="text-xs text-muted-foreground">
                processados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ticket Médio
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {metrics?.activeSubscriptions 
                  ? (metrics.mrr / metrics.activeSubscriptions).toFixed(2) 
                  : '0.00'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                por assinante
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Assinaturas</CardTitle>
            <CardDescription>
              Lista de todas as assinaturas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente ou plano..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="paused">Pausadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                  <SelectItem value="past_due">Pagamento Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : filteredSubscriptions && filteredSubscriptions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Próxima Cobrança</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <p className="font-medium">{sub.user_id}</p>
                      </TableCell>
                      <TableCell>{sub.plan?.name || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>
                        R$ {(sub.plan?.price_monthly || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {sub.created_at 
                          ? format(new Date(sub.created_at), 'dd/MM/yyyy', { locale: ptBR })
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        {sub.current_period_end
                          ? format(new Date(sub.current_period_end), 'dd/MM/yyyy', { locale: ptBR })
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma assinatura encontrada
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
