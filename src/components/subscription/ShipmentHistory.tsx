import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Download, Package, TrendingUp, Users, Search, Filter } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSubscriptionShipments } from '@/hooks/useSubscriptionShipments';
import { ShipmentStatus } from '@/types/subscription';

type PeriodFilter = 'all' | 'last-month' | 'last-3-months' | 'last-6-months' | 'last-year';

interface ShipmentHistoryProps {
  subscriptionId?: string;
}

export function ShipmentHistory({ subscriptionId }: ShipmentHistoryProps = {}) {
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('last-3-months');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: shipments = [], isLoading } = useSubscriptionShipments({
    status: statusFilter === 'all' ? undefined : statusFilter,
    subscriptionId,
  });

  // Filtrar por período
  const filteredByPeriod = useMemo(() => {
    if (periodFilter === 'all') return shipments;

    const now = new Date();
    let startDate: Date;

    switch (periodFilter) {
      case 'last-month':
        startDate = startOfMonth(subMonths(now, 1));
        break;
      case 'last-3-months':
        startDate = startOfMonth(subMonths(now, 3));
        break;
      case 'last-6-months':
        startDate = startOfMonth(subMonths(now, 6));
        break;
      case 'last-year':
        startDate = startOfMonth(subMonths(now, 12));
        break;
      default:
        return shipments;
    }

    return shipments.filter((s) =>
      isWithinInterval(new Date(s.created_at), {
        start: startDate,
        end: now,
      })
    );
  }, [shipments, periodFilter]);

  // Filtrar por busca
  const filteredShipments = useMemo(() => {
    if (!searchTerm) return filteredByPeriod;

    const term = searchTerm.toLowerCase();
    return filteredByPeriod.filter(
      (s) =>
        s.tracking_code?.toLowerCase().includes(term) ||
        s.subscription?.plan?.name?.toLowerCase().includes(term)
    );
  }, [filteredByPeriod, searchTerm]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = filteredShipments.length;
    const delivered = filteredShipments.filter((s) => s.status === 'delivered').length;
    const shipped = filteredShipments.filter((s) => s.status === 'shipped').length;
    const pending = filteredShipments.filter((s) => s.status === 'pending').length;

    // Calcular taxa de entrega
    const deliveryRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : '0';

    // Usuários únicos
    const uniqueUsers = new Set(filteredShipments.map((s) => s.subscription?.user_id)).size;

    return { total, delivered, shipped, pending, deliveryRate, uniqueUsers };
  }, [filteredShipments]);

  // Exportar CSV
  const handleExportCSV = () => {
    const headers = ['Data', 'Plano', 'Perfumes', 'Status', 'Rastreio', 'Data Envio', 'Data Entrega'];
    const rows = filteredShipments.map((s) => [
      format(new Date(s.created_at), 'dd/MM/yyyy', { locale: ptBR }),
      s.subscription?.plan?.name || 'N/A',
      s.perfumes?.map(p => p.name).join(', ') || 'N/A',
      s.status,
      s.tracking_code || 'N/A',
      s.shipped_at ? format(new Date(s.shipped_at), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A',
      s.delivered_at ? format(new Date(s.delivered_at), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historico-envios-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getStatusBadge = (status: ShipmentStatus) => {
    const variants: Record<ShipmentStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'outline', label: 'Pendente' },
      processing: { variant: 'secondary', label: 'Processando' },
      shipped: { variant: 'default', label: 'Enviado' },
      delivered: { variant: 'secondary', label: 'Entregue' },
      failed: { variant: 'destructive', label: 'Falhou' },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Envios</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deliveryRate}%</div>
            <p className="text-xs text-muted-foreground">{stats.delivered} entregues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Trânsito</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.shipped}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Envios</CardTitle>
          <CardDescription>Visualize todos os envios realizados com filtros avançados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-center flex-1">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por rastreio ou plano..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo o período</SelectItem>
                  <SelectItem value="last-month">Último mês</SelectItem>
                  <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
                  <SelectItem value="last-6-months">Últimos 6 meses</SelectItem>
                  <SelectItem value="last-year">Último ano</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ShipmentStatus | 'all')}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="shipped">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleExportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {/* Tabela */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Perfumes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rastreio</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Entregue em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum envio encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">
                        {format(new Date(shipment.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{shipment.subscription?.plan?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          {shipment.perfumes.length > 0 
                            ? shipment.perfumes.map(p => p.name).join(', ')
                            : 'N/A'
                          }
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                      <TableCell>
                        {shipment.tracking_code ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">{shipment.tracking_code}</code>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {shipment.shipped_at
                          ? format(new Date(shipment.shipped_at), 'dd/MM/yyyy', { locale: ptBR })
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {shipment.delivered_at
                          ? format(new Date(shipment.delivered_at), 'dd/MM/yyyy', { locale: ptBR })
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
