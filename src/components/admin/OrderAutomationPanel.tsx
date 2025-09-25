import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, FileText, Mail, Package, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AutomationExplainer } from './AutomationExplainer';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  user_id: string;
  fiscal_notes?: any[];
  shipments?: any[];
}

export const OrderAutomationPanel = () => {
  const [orders, setOrders] = useState<Order[]>([]);
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
        .limit(10);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Erro ao Carregar Pedidos",
        description: "Não foi possível carregar os pedidos recentes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const retryNFeGeneration = async (orderId: string) => {
    setProcessingOrder(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('retry-nfe-generation', {
        body: { order_id: orderId }
      });

      if (error) throw error;

      toast({
        title: "NF-e Processada",
        description: "A nota fiscal foi gerada com sucesso.",
      });

      loadRecentOrders();
    } catch (error) {
      console.error('Error retrying NF-e generation:', error);
      toast({
        title: "Erro na Geração de NF-e",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setProcessingOrder(null);
    }
  };

  const getAutomationStatus = (order: Order) => {
    const hasNFe = order.fiscal_notes && order.fiscal_notes.length > 0;
    const hasShipment = order.shipments && order.shipments.length > 0;
    
    if (hasNFe && hasShipment) {
      return { status: 'complete', text: 'Completo', color: 'bg-green-500' };
    } else if (hasShipment) {
      return { status: 'partial', text: 'Etiqueta OK', color: 'bg-yellow-500' };
    } else if (hasNFe) {
      return { status: 'partial', text: 'NF-e OK', color: 'bg-blue-500' };
    }
    return { status: 'pending', text: 'Pendente', color: 'bg-red-500' };
  };

  if (loading) {
    return <div className="p-6">Carregando pedidos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Automação de Pedidos</h2>
        <Button onClick={loadRecentOrders} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      <AutomationExplainer />

      <div className="grid gap-4">
        {orders.map((order) => {
          const automationStatus = getAutomationStatus(order);
          const hasNFe = order.fiscal_notes && order.fiscal_notes.length > 0;
          const hasShipment = order.shipments && order.shipments.length > 0;

          return (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      Pedido: {order.order_number}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Valor: R$ {order.total_amount.toFixed(2)} | 
                      Status: {order.status} | 
                      Data: {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge className={automationStatus.color}>
                      {automationStatus.text}
                    </Badge>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`flex items-center gap-1 ${hasNFe ? 'text-green-600' : 'text-red-600'}`}>
                        <FileText className="w-4 h-4" />
                        {hasNFe ? 'NF-e' : 'Sem NF-e'}
                      </div>
                      
                      <div className={`flex items-center gap-1 ${hasShipment ? 'text-green-600' : 'text-red-600'}`}>
                        <Package className="w-4 h-4" />
                        {hasShipment ? 'Etiqueta' : 'Sem Etiqueta'}
                      </div>
                    </div>
                  </div>
                </div>

                {automationStatus.status !== 'complete' && (
                  <div className="flex gap-2 mt-4">
                    {!hasNFe && (
                      <Button
                        size="sm"
                        onClick={() => retryNFeGeneration(order.id)}
                        disabled={processingOrder === order.id}
                        className="flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        {processingOrder === order.id ? 'Processando...' : 'Gerar NF-e'}
                      </Button>
                    )}
                    
                    {!hasShipment && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Package className="w-4 h-4" />
                        Criar Etiqueta
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {orders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground">
              Pedidos pagos aparecerão aqui após serem processados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};