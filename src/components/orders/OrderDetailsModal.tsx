
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, MapPin, CreditCard, Truck, Calendar } from 'lucide-react';
import { Order } from '@/types/order';

interface OrderDetailsModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailsModal = ({ order, isOpen, onClose }: OrderDetailsModalProps) => {
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-playfair text-2xl">
            Pedido #{order.order_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Data do Pedido</p>
                <p className="text-gray-600">
                  {new Date(order.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(order.status)}>
              {getStatusText(order.status)}
            </Badge>
          </div>

          <Separator />

          {/* Items */}
          <div>
            <h3 className="font-medium mb-4 flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Itens do Pedido
            </h3>
            <div className="space-y-4">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.perfume?.name}</h4>
                    <p className="text-gray-600">{item.perfume?.brand}</p>
                    <p className="text-sm text-gray-500">
                      Tamanho: {item.size_ml}ml • Quantidade: {item.quantity}
                    </p>
                    <p className="text-sm text-gray-500">
                      Preço unitário: R$ {item.unit_price.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      R$ {item.total_price.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Address */}
          <div>
            <h3 className="font-medium mb-4 flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Endereço de Entrega
            </h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">{order.address_data?.name}</p>
              <p>{order.address_data?.street}, {order.address_data?.number}</p>
              {order.address_data?.complement && (
                <p>{order.address_data.complement}</p>
              )}
              <p>{order.address_data?.district}</p>
              <p>{order.address_data?.city} - {order.address_data?.state}</p>
              <p>CEP: {order.address_data?.cep}</p>
            </div>
          </div>

          <Separator />

          {/* Payment and Shipping */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-4 flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Pagamento
              </h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Método:</span>{' '}
                  {order.payment_method === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                </p>
                {order.transaction_id && (
                  <p className="text-sm text-gray-600">
                    ID: {order.transaction_id}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4 flex items-center">
                <Truck className="mr-2 h-5 w-5" />
                Entrega
              </h3>
              <div className="space-y-2">
                {order.shipping_service && (
                  <p>
                    <span className="font-medium">Serviço:</span> {order.shipping_service}
                  </p>
                )}
                {order.shipping_deadline && (
                  <p>
                    <span className="font-medium">Prazo:</span> {order.shipping_deadline} dias úteis
                  </p>
                )}
                <p>
                  <span className="font-medium">Custo:</span>{' '}
                  R$ {order.shipping_cost.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>R$ {order.subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between">
              <span>Frete:</span>
              <span>R$ {order.shipping_cost.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>R$ {order.total_amount.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
