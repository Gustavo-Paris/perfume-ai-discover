import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  FileText, 
  Truck, 
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';
import { SystemNotifications } from './SystemNotifications';

interface OrderWithDetails {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  user_id: string;
  fiscal_notes: any[];
  shipments: any[];
}

export const OrderManagementPanel = () => {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRecentOrders();
  }, []);

  const loadRecentOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          fiscal_notes (*),
          shipments (*)
        `)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Erro ao Carregar Pedidos",
        description: "Não foi possível carregar os pedidos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNFE = async (orderId: string) => {
    setProcessingOrder(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-nfe', {
        body: { order_id: orderId }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "NF-e Gerada",
          description: "A nota fiscal foi gerada com sucesso.",
        });
        loadRecentOrders();
      } else {
        throw new Error(data.error || 'Erro ao gerar NF-e');
      }
    } catch (error) {
      console.error('Error generating NF-e:', error);
      toast({
        title: "Erro ao Gerar NF-e",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setProcessingOrder(null);
    }
  };

  const createShipmentLabel = async (orderId: string) => {
    setProcessingOrder(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('me-buy-label', {
        body: { orderId }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Etiqueta Criada",
          description: "A etiqueta de envio foi criada com sucesso.",
        });
        loadRecentOrders();
      } else {
        throw new Error(data.error || 'Erro ao criar etiqueta');
      }
    } catch (error) {
      console.error('Error creating shipment label:', error);
      toast({
        title: "Erro ao Criar Etiqueta",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setProcessingOrder(null);
    }
  };

  const getOrderStatus = (order: OrderWithDetails) => {
    const hasNFE = order.fiscal_notes && order.fiscal_notes.length > 0;
    const hasShipment = order.shipments && order.shipments.length > 0;
    
    if (hasNFE && hasShipment) {
      return { status: 'complete', text: 'Completo', color: 'bg-green-500' };
    } else if (hasNFE && !hasShipment) {
      return { status: 'need_label', text: 'Precisa Etiqueta', color: 'bg-yellow-500' };
    } else if (!hasNFE && hasShipment) {
      return { status: 'need_nfe', text: 'Precisa NF-e', color: 'bg-orange-500' };
    } else {
      return { status: 'pending', text: 'Pendente', color: 'bg-red-500' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4" />;
      case 'need_label':
      case 'need_nfe':
        return <AlertCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="p-6">Carregando pedidos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Pedidos</h2>
          <p className="text-muted-foreground">
            Gerencie NF-e, etiquetas e rastreamento de forma integrada
          </p>
        </div>
        <Button onClick={loadRecentOrders} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <SystemNotifications />

      <div className="grid gap-4">
        {orders.map((order) => {
          const orderStatus = getOrderStatus(order);
          const isProcessing = processingOrder === order.id;
          
          return (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(orderStatus.status)}
                      <div>
                        <h3 className="font-semibold">
                          Pedido {order.order_number}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Valor: R$ {order.total_amount.toFixed(2)} | 
                          Data: {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">
                              NF-e: {order.fiscal_notes?.length > 0 ? 
                                <span className="text-green-600">✓ Emitida</span> : 
                                <span className="text-red-600">✗ Pendente</span>}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            <span className="text-sm">
                              Etiqueta: {order.shipments?.length > 0 ? 
                                <span className="text-green-600">✓ Criada</span> : 
                                <span className="text-red-600">✗ Pendente</span>}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge className={orderStatus.color}>
                      {orderStatus.text}
                    </Badge>
                    
                    <div className="flex gap-2">
                      {!order.fiscal_notes?.length && (
                        <Button
                          size="sm"
                          onClick={() => generateNFE(order.id)}
                          disabled={isProcessing}
                          className="flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Gerar NF-e
                        </Button>
                      )}
                      
                      {order.fiscal_notes?.length > 0 && !order.shipments?.length && (
                        <Button
                          size="sm" 
                          onClick={() => createShipmentLabel(order.id)}
                          disabled={isProcessing}
                          className="flex items-center gap-2"
                        >
                          <Package className="w-4 h-4" />
                          Criar Etiqueta
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => {
                          // Navigate to order details
                          window.open(`/admin/orders/${order.id}`, '_blank');
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        Detalhes
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {orders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground">
              Os pedidos pagos aparecerão aqui para processamento.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};