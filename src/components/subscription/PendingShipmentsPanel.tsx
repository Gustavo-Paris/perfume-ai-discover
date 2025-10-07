import { useState } from 'react';
import { useSubscriptionShipments } from '@/hooks/useSubscriptionShipments';
import { PendingShipmentCard } from './PendingShipmentCard';
import { ShipmentDetailsModal } from './ShipmentDetailsModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Download, Package } from 'lucide-react';
import { ShipmentStatus } from '@/types/subscription';

export function PendingShipmentsPanel() {
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<any>(null);

  const { data: shipments, isLoading } = useSubscriptionShipments(
    statusFilter !== 'all' ? { status: statusFilter as ShipmentStatus } : undefined
  );

  const filteredShipments = shipments?.filter((shipment) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      shipment.month_year.toLowerCase().includes(searchLower) ||
      shipment.subscription.plan.name.toLowerCase().includes(searchLower) ||
      shipment.perfumes.some(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.brand.toLowerCase().includes(searchLower)
      )
    );
  });

  const pendingCount = shipments?.filter((s) => s.status === 'pending').length || 0;
  const processingCount = shipments?.filter((s) => s.status === 'processing').length || 0;

  const handleExportCSV = () => {
    if (!filteredShipments || filteredShipments.length === 0) return;

    const csvContent = [
      ['Mês/Ano', 'Plano', 'Status', 'Perfumes', 'Rastreio', 'Criado em'].join(','),
      ...filteredShipments.map((s) =>
        [
          s.month_year,
          s.subscription.plan.name,
          s.status,
          s.perfumes.map((p) => `${p.brand} ${p.name}`).join(' | '),
          s.tracking_code || '',
          new Date(s.created_at).toLocaleDateString('pt-BR')
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `envios_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pendentes</CardDescription>
            <CardTitle className="text-3xl">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Em Processamento</CardDescription>
            <CardTitle className="text-3xl">{processingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Envios</CardDescription>
            <CardTitle className="text-3xl">{shipments?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por mês, plano ou perfume..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ShipmentStatus | 'all')}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={!filteredShipments || filteredShipments.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shipments Grid */}
      {filteredShipments && filteredShipments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShipments.map((shipment) => (
            <PendingShipmentCard
              key={shipment.id}
              shipment={shipment}
              onViewDetails={() => setSelectedShipment(shipment)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum envio encontrado</p>
            <p className="text-sm text-muted-foreground">
              {searchTerm
                ? 'Tente ajustar os filtros de busca'
                : 'Não há envios com os filtros selecionados'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Details Modal */}
      {selectedShipment && (
        <ShipmentDetailsModal
          isOpen={!!selectedShipment}
          onClose={() => setSelectedShipment(null)}
          shipment={selectedShipment}
        />
      )}
    </div>
  );
}
