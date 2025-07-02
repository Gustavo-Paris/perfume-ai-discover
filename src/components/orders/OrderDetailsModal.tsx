
import { X, Package, Calendar, MapPin, CreditCard, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/types/order';
import { ShipmentCard } from './ShipmentCard';

interface OrderDetailsModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'processing': return 'Processando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-playfair text-2xl">
              Pedido #{order.order_number}
            </DialogTitle>
            <Badge className={getStatusColor(order.status)}>
              {getStatusText(order.status)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">Data do Pedido</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">Pagamento</p>
                  <p className="text-sm text-gray-600">
                    {order.payment_method === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Status: {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <p className="font-medium">Endereço de Entrega</p>
                  <div className="text-sm text-gray-600">
                    <p>{order.address_data?.street}, {order.address_data?.number}</p>
                    {order.address_data?.complement && (
                      <p>{order.address_data.complement}</p>
                    )}
                    <p>{order.address_data?.district}</p>
                    <p>{order.address_data?.city} - {order.address_data?.state}</p>
                    <p>CEP: {order.address_data?.cep}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-medium mb-4 flex items-center">
              <Package className="mr-2 h-4 w-4" />
              Itens do Pedido
            </h3>
            <div className="space-y-3">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium">{item.perfume?.name}</h4>
                      <p className="text-sm text-gray-600">{item.perfume?.brand}</p>
                      <p className="text-sm text-gray-600">
                        {item.size_ml}ml • Quantidade: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      R$ {item.total_price.toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-sm text-gray-600">
                      R$ {item.unit_price.toFixed(2).replace('.', ',')} cada
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Information */}
          <ShipmentCard order={order} />

          {/* Total */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>R$ {order.subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Frete:</span>
                <span>R$ {order.shipping_cost.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>R$ {order.total_amount.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
