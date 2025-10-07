import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Truck, CheckCircle, Clock, Eye } from 'lucide-react';
import { useManageSubscriptionShipment } from '@/hooks/useManageSubscriptionShipment';
import { ShipmentStatus } from '@/types/subscription';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendingShipmentCardProps {
  shipment: {
    id: string;
    month_year: string;
    status: ShipmentStatus;
    tracking_code: string | null;
    created_at: string;
    subscription: {
      user_id: string;
      plan: {
        name: string;
        decants_per_month: number;
        size_ml: number;
      };
    };
    perfumes: Array<{
      id: string;
      name: string;
      brand: string;
      image_url: string | null;
    }>;
  };
  onViewDetails: () => void;
}

export function PendingShipmentCard({ shipment, onViewDetails }: PendingShipmentCardProps) {
  const [trackingInput, setTrackingInput] = useState(shipment.tracking_code || '');
  const { updateShipmentStatus, addTrackingCode, markAsShipped, loading } = useManageSubscriptionShipment();

  const getStatusConfig = (status: ShipmentStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendente',
          icon: Clock,
          variant: 'secondary' as const,
          color: 'text-yellow-600'
        };
      case 'processing':
        return {
          label: 'Processando',
          icon: Package,
          variant: 'default' as const,
          color: 'text-blue-600'
        };
      case 'shipped':
        return {
          label: 'Enviado',
          icon: Truck,
          variant: 'default' as const,
          color: 'text-purple-600'
        };
      case 'delivered':
        return {
          label: 'Entregue',
          icon: CheckCircle,
          variant: 'default' as const,
          color: 'text-green-600'
        };
      default:
        return {
          label: status,
          icon: Clock,
          variant: 'secondary' as const,
          color: 'text-gray-600'
        };
    }
  };

  const statusConfig = getStatusConfig(shipment.status);
  const StatusIcon = statusConfig.icon;

  const handleMarkAsProcessing = async () => {
    await updateShipmentStatus(shipment.id, 'processing');
  };

  const handleAddTracking = async () => {
    if (trackingInput.trim()) {
      await addTrackingCode(shipment.id, trackingInput.trim());
    }
  };

  const handleMarkAsShipped = async () => {
    if (trackingInput.trim()) {
      await markAsShipped(shipment.id, trackingInput.trim());
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              📅 {shipment.month_year}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {shipment.subscription.plan.name}
            </p>
          </div>
          <Badge variant={statusConfig.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Perfumes Grid */}
        <div>
          <p className="text-sm font-medium mb-2">Perfumes Selecionados:</p>
          <div className="grid grid-cols-2 gap-2">
            {shipment.perfumes.map((perfume) => (
              <div key={perfume.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                {perfume.image_url ? (
                  <img
                    src={perfume.image_url}
                    alt={perfume.name}
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{perfume.brand}</p>
                  <p className="text-xs text-muted-foreground truncate">{perfume.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tracking Code */}
        {shipment.status !== 'pending' && (
          <div>
            <p className="text-sm font-medium mb-2">Código de Rastreio:</p>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: BR123456789"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                disabled={shipment.status === 'shipped' || shipment.status === 'delivered'}
              />
              {shipment.status === 'processing' && !shipment.tracking_code && (
                <Button
                  onClick={handleAddTracking}
                  disabled={loading || !trackingInput.trim()}
                  size="sm"
                >
                  Adicionar
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>

          {shipment.status === 'pending' && (
            <Button
              onClick={handleMarkAsProcessing}
              disabled={loading}
              size="sm"
              className="flex-1"
            >
              <Package className="h-4 w-4 mr-2" />
              Processar
            </Button>
          )}

          {shipment.status === 'processing' && trackingInput.trim() && (
            <Button
              onClick={handleMarkAsShipped}
              disabled={loading}
              size="sm"
              className="flex-1"
            >
              <Truck className="h-4 w-4 mr-2" />
              Marcar como Enviado
            </Button>
          )}
        </div>

        {/* Created Date */}
        <p className="text-xs text-muted-foreground">
          Criado em {format(new Date(shipment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </CardContent>
    </Card>
  );
}
