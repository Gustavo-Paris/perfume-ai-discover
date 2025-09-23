import { useState } from 'react';
import { Package, Truck, MapPin, Calendar, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Order } from '@/types/order';
import { useShipments, useBuyLabel } from '@/hooks/useShipments';

interface EnhancedShipmentCardProps {
  order: Order;
}

export const EnhancedShipmentCard: React.FC<EnhancedShipmentCardProps> = ({ order }) => {
  const { data: shipments, isLoading: shipmentsLoading } = useShipments(order.id);
  const buyLabelMutation = useBuyLabel();
  const [showDetails, setShowDetails] = useState(false);

  const getDeliveryType = () => {
    if (order.shipping_service?.toLowerCase().includes('retirada') || 
        order.shipping_service?.toLowerCase().includes('pickup')) {
      return 'pickup';
    } else if (order.shipping_service?.toLowerCase().includes('local')) {
      return 'local_delivery';
    }
    return 'standard';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cart_added': return 'bg-blue-100 text-blue-800';
      case 'purchased': return 'bg-purple-100 text-purple-800';
      case 'label_printed': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-600 text-white';
      case 'delivered': return 'bg-green-600 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'cart_added': return 'Preparando';
      case 'purchased': return 'Etiqueta Comprada';
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
      console.error('Error buying label:', error);
    }
  };

  const deliveryType = getDeliveryType();

  if (shipmentsLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Carregando informações de entrega...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {deliveryType === 'pickup' ? (
            <>
              <Package className="h-5 w-5" />
              <span>Retirada Local</span>
            </>
          ) : deliveryType === 'local_delivery' ? (
            <>
              <Truck className="h-5 w-5" />
              <span>Entrega Local</span>
            </>
          ) : (
            <>
              <Truck className="h-5 w-5" />
              <span>Informações de Envio</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {deliveryType === 'pickup' ? (
          <div className="space-y-3">
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Local de Retirada:</p>
                  <div className="text-sm">
                    <p>Rua Florianópolis - D, 828</p>
                    <p>Jardim Itália, Chapecó - SC</p>
                    <p>CEP: 89814-000</p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Horário: Segunda a sexta, 8h às 18h</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ Traga um documento com foto para retirada
                  </p>
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status da Retirada:</span>
              <Badge className="bg-blue-100 text-blue-800">
                Aguardando Retirada
              </Badge>
            </div>
          </div>
        ) : deliveryType === 'local_delivery' ? (
          <div className="space-y-3">
            <Alert>
              <Truck className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Entrega Local</p>
                  <p className="text-sm">
                    Entrega será realizada no endereço cadastrado em até 2 dias úteis.
                  </p>
                  <div className="text-sm">
                    <p className="font-medium">Endereço de Entrega:</p>
                    <p>{order.address_data?.street}, {order.address_data?.number}</p>
                    {order.address_data?.complement && <p>{order.address_data.complement}</p>}
                    <p>{order.address_data?.district}</p>
                    <p>{order.address_data?.city} - {order.address_data?.state}</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status da Entrega:</span>
              <Badge className="bg-green-100 text-green-800">
                Programada para Entrega
              </Badge>
            </div>
          </div>
        ) : (
          <>
            {/* Envio pelos Correios */}
            {shipments && shipments.length > 0 ? (
              <div className="space-y-3">
                {shipments.map((shipment) => (
                  <div key={shipment.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Código de Rastreamento</span>
                      <Badge className={getStatusColor(shipment.status)}>
                        {getStatusText(shipment.status)}
                      </Badge>
                    </div>
                    
                    {shipment.tracking_code && (
                      <div className="bg-gray-50 p-2 rounded text-center font-mono text-sm">
                        {shipment.tracking_code}
                      </div>
                    )}
                    
                    {shipment.service_name && (
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span>Serviço:</span>
                        <span className="font-medium">{shipment.service_name}</span>
                      </div>
                    )}
                    
                    {shipment.estimated_delivery_days && (
                      <div className="flex items-center justify-between text-sm">
                        <span>Prazo estimado:</span>
                        <span>{shipment.estimated_delivery_days} dias úteis</span>
                      </div>
                    )}
                    
                    {shipment.pdf_url && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={() => window.open(shipment.pdf_url, '_blank')}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Baixar Etiqueta
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-4">
                  Etiqueta de envio ainda não processada
                </p>
                
                {order.payment_status === 'paid' && (
                  <Button 
                    size="sm" 
                    onClick={handleBuyLabel}
                    disabled={buyLabelMutation.isPending}
                  >
                    {buyLabelMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      'Processar Envio'
                    )}
                  </Button>
                )}
                
                {buyLabelMutation.isError && (
                  <Alert className="mt-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Erro ao processar envio. Tente novamente.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};