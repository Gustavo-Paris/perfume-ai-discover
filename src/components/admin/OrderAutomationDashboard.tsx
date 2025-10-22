import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, Package, FileText, Truck, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface OrderAutomation {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  has_nfe: boolean;
  has_shipment: boolean;
  nfe_status?: string;
  shipment_status?: string;
  automation_status: 'complete' | 'partial' | 'pending' | 'error';
}

export const OrderAutomationDashboard = () => {
  const [orders, setOrders] = useState<OrderAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          payment_status,
          total_amount,
          created_at,
          fiscal_notes (id, status),
          shipments (id, status)
        `)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const processedOrders = (data || []).map((order: any) => {
        const hasNfe = order.fiscal_notes && order.fiscal_notes.length > 0;
        const hasShipment = order.shipments && order.shipments.length > 0;
        const nfeStatus = hasNfe ? order.fiscal_notes[0].status : undefined;
        const shipmentStatus = hasShipment ? order.shipments[0].status : undefined;

        let automationStatus: 'complete' | 'partial' | 'pending' | 'error' = 'pending';
        
        if (nfeStatus === 'error' || shipmentStatus === 'error') {
          automationStatus = 'error';
        } else if (hasNfe && hasShipment) {
          automationStatus = 'complete';
        } else if (hasNfe || hasShipment) {
          automationStatus = 'partial';
        }

        return {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          payment_status: order.payment_status,
          total_amount: order.total_amount,
          created_at: order.created_at,
          has_nfe: hasNfe,
          has_shipment: hasShipment,
          nfe_status: nfeStatus,
          shipment_status: shipmentStatus,
          automation_status: automationStatus,
        };
      });

      setOrders(processedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: 'Erro ao carregar pedidos',
        description: 'Não foi possível carregar os pedidos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const retryAutomation = async (orderId: string) => {
    setProcessing(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('process-payment-automation', {
        body: { order_id: orderId }
      });

      if (error) throw error;

      toast({
        title: 'Automação iniciada',
        description: 'O processamento foi iniciado com sucesso',
      });

      // Reload orders after a delay
      setTimeout(() => {
        loadOrders();
      }, 2000);
    } catch (error) {
      console.error('Error retrying automation:', error);
      toast({
        title: 'Erro ao processar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'partial':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-100 text-green-800">Completo</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">Parcial</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Erro</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pendente</Badge>;
    }
  };

  const stats = {
    total: orders.length,
    complete: orders.filter(o => o.automation_status === 'complete').length,
    partial: orders.filter(o => o.automation_status === 'partial').length,
    error: orders.filter(o => o.automation_status === 'error').length,
    pending: orders.filter(o => o.automation_status === 'pending').length,
  };

  const successRate = stats.total > 0 ? ((stats.complete / stats.total) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-playfair">Automação de Pedidos</h1>
          <p className="text-muted-foreground mt-1">
            Monitore NFe e etiquetas geradas automaticamente
          </p>
        </div>
        <Button onClick={loadOrders} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completos</p>
                <p className="text-2xl font-bold text-green-600">{stats.complete}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Parciais</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.partial}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Erros</p>
                <p className="text-2xl font-bold text-red-600">{stats.error}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa Sucesso</p>
                <p className="text-2xl font-bold text-blue-600">{successRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4 flex-1">
                  {getStatusIcon(order.automation_status)}
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">#{order.order_number}</span>
                      {getStatusBadge(order.automation_status)}
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span>R$ {order.total_amount.toFixed(2)}</span>
                      <span>•</span>
                      <span>{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <FileText className={`h-4 w-4 ${order.has_nfe ? 'text-green-600' : 'text-gray-300'}`} />
                      <span className="text-sm">{order.has_nfe ? 'NFe' : '—'}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Truck className={`h-4 w-4 ${order.has_shipment ? 'text-green-600' : 'text-gray-300'}`} />
                      <span className="text-sm">{order.has_shipment ? 'Etiqueta' : '—'}</span>
                    </div>
                  </div>
                </div>

                {(order.automation_status === 'error' || order.automation_status === 'partial' || order.automation_status === 'pending') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => retryAutomation(order.id)}
                    disabled={processing === order.id}
                  >
                    {processing === order.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Processar
                      </>
                    )}
                  </Button>
                )}
              </div>
            ))}

            {orders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum pedido pago encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
