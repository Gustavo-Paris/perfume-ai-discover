
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Calendar, MapPin, CreditCard, Eye, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types/order';
import { OrderDetailsModal } from '@/components/orders/OrderDetailsModal';

const Pedidos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    loadOrders();
  }, [user, navigate]);

  const loadOrders = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Usar a função RPC que faz JOIN explícito com perfumes
      const { data, error } = await supabase.rpc('get_user_orders_with_perfumes', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error loading orders:', error);
        return;
      }

      // Transformar os dados para manter compatibilidade com o tipo Order
      const transformedOrders = data?.map(order => ({
        ...order,
        address_data: order.address_data as any,
        order_items: Array.isArray(order.order_items) 
          ? (order.order_items as any[]).map(item => ({
              ...item,
              perfume: item.perfume || null
            }))
          : []
      })) || [];

      setOrders(transformedOrders as Order[]);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
          <p className="mt-2 text-gray-600">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="font-playfair text-3xl font-bold">Meus Pedidos</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum pedido encontrado
              </h3>
              <p className="text-gray-600 mb-6">
                Você ainda não fez nenhum pedido. Que tal explorar nosso catálogo?
              </p>
              <Button onClick={() => navigate('/catalogo')}>
                Ver Catálogo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-playfair text-lg">
                        Pedido #{order.order_number}
                      </CardTitle>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Calendar className="mr-1 h-4 w-4" />
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                      <p className="text-lg font-bold mt-1">
                        R$ {order.total_amount.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Items */}
                    <div className="md:col-span-2">
                      <h4 className="font-medium mb-3">Itens do Pedido</h4>
                      <div className="space-y-3">
                        {order.order_items?.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                              {item.perfume?.image_url ? (
                                <img 
                                  src={item.perfume.image_url} 
                                  alt={item.perfume.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.perfume?.name || 'Produto'}</p>
                              <p className="text-xs text-gray-600">
                                {item.perfume?.brand || 'Marca não informada'} • {item.size_ml}ml • Qty: {item.quantity}
                              </p>
                            </div>
                            <p className="font-medium text-sm">
                              R$ {item.total_price.toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                        ))}
                        {order.order_items && order.order_items.length > 3 && (
                          <p className="text-sm text-gray-600">
                            +{order.order_items.length - 3} item(s) adicional(is)
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                        <div className="text-sm">
                          <p className="font-medium">
                            {order.shipping_service?.toLowerCase().includes('retirada') || 
                             order.shipping_service?.toLowerCase().includes('pickup') 
                              ? 'Retirada Local' 
                              : order.shipping_service?.toLowerCase().includes('local')
                              ? 'Entrega Local'
                              : 'Endereço de Entrega'}
                          </p>
                          {order.shipping_service?.toLowerCase().includes('retirada') || 
                           order.shipping_service?.toLowerCase().includes('pickup') ? (
                            <div className="text-gray-600">
                              <p className="font-medium">Local de Retirada:</p>
                              <p>Rua Florianópolis - D, 828</p>
                              <p>Jardim Itália, Chapecó - SC</p>
                              <p className="text-xs text-blue-600 mt-1">
                                Segunda a sexta: 8h às 18h
                              </p>
                            </div>
                          ) : (
                            <div className="text-gray-600">
                              <p>{order.address_data?.street}, {order.address_data?.number}</p>
                              {order.address_data?.complement && (
                                <p>{order.address_data.complement}</p>
                              )}
                              <p>{order.address_data?.district}</p>
                              <p>{order.address_data?.city} - {order.address_data?.state}</p>
                              {order.address_data?.cep && <p>CEP: {order.address_data.cep}</p>}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <CreditCard className="h-4 w-4 text-gray-400 mt-1" />
                        <div className="text-sm">
                          <p className="font-medium">Pagamento</p>
                          <p className="text-gray-600">
                            {order.payment_method === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                        className="w-full"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

export default Pedidos;
