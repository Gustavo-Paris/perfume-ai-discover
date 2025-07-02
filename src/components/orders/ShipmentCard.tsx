
import { useState } from 'react';
import { Package, FileText, Truck, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useShipments, useBuyLabel } from '@/hooks/useShipments';
import { Order } from '@/types/order';

interface ShipmentCardProps {
  order: Order;
}

export const ShipmentCard: React.FC<ShipmentCardProps> = ({ order }) => {
  const { data: shipments, isLoading } = useShipments(order.id);
  const buyLabelMutation = useBuyLabel();
  const [showDetails, setShowDetails] = useState(false);

  const shipment = shipments?.[0]; // Get the first (most recent) shipment

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cart_added': return 'bg-blue-100 text-blue-800';
      case 'purchased': return 'bg-green-100 text-green-800';
      case 'label_printed': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'cart_added': return 'Adicionado ao Carrinho';
      case 'purchased': return 'Comprado';
      case 'label_printed': return 'Etiqueta Impressa';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregue';
      default: return status;
    }
  };

  const handleBuyLabel = async () => {
    try {
      await buyLabelMutation.mutateAsync({ orderId: order.id });
    } catch (error) {
      console.error('Erro ao comprar etiqueta:', error);
    }
  };

  const canBuyLabel = order.status === 'paid' && (!shipment || shipment.status === 'pending');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 animate-pulse" />
            <span>Carregando informações de envio...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck className="h-5 w-5" />
            <span>Informações de Envio</span>
          </div>
          {shipment && (
            <Badge className={getStatusColor(shipment.status)}>
              {getStatusText(shipment.status)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!shipment ? (
          <div className="text-center py-4">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 mb-4">Nenhuma informação de envio ainda</p>
            {canBuyLabel && (
              <Button 
                onClick={handleBuyLabel}
                disabled={buyLabelMutation.isPending}
                className="w-full"
              >
                {buyLabelMutation.isPending ? 'Processando...' : 'Comprar Etiqueta'}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shipment.tracking_code && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Código de Rastreamento
                  </label>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {shipment.tracking_code}
                  </p>
                </div>
              )}
              
              {shipment.service_name && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Serviço de Entrega
                  </label>
                  <p className="text-sm">{shipment.service_name}</p>
                </div>
              )}
              
              {shipment.estimated_delivery_days && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Prazo Estimado
                  </label>
                  <p className="text-sm">
                    {shipment.estimated_delivery_days === 1 
                      ? '1 dia útil' 
                      : `${shipment.estimated_delivery_days} dias úteis`}
                  </p>
                </div>
              )}
              
              {shipment.service_price && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Custo do Frete
                  </label>
                  <p className="text-sm">
                    R$ {shipment.service_price.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              )}
            </div>

            {shipment.pdf_url && (
              <div className="pt-4 border-t">
                <Button
                  onClick={() => window.open(shipment.pdf_url, '_blank')}
                  variant="outline"
                  className="w-full"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Baixar Etiqueta PDF
                </Button>
              </div>
            )}

            {canBuyLabel && shipment.status === 'pending' && (
              <div className="pt-4 border-t">
                <Button 
                  onClick={handleBuyLabel}
                  disabled={buyLabelMutation.isPending}
                  className="w-full"
                >
                  {buyLabelMutation.isPending ? 'Processando...' : 'Reprocessar Etiqueta'}
                </Button>
              </div>
            )}

            {buyLabelMutation.error && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Erro ao processar etiqueta: {buyLabelMutation.error.message}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
