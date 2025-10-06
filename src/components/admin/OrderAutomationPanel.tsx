import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, FileText, Mail, Package, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AutomationExplainer } from './AutomationExplainer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadRecentOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter]);

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
        description: "Não foi possível carregar os pedidos recentes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;
    
    if (statusFilter === 'nfe_error') {
      filtered = orders.filter(order => {
        const hasNFe = order.fiscal_notes && order.fiscal_notes.length > 0;
        const nfeHasError = order.fiscal_notes?.some(
          (note: any) => note.status === 'rejected' || note.erro_message
        );
        return !hasNFe || nfeHasError;
      });
    } else if (statusFilter === 'missing_nfe') {
      filtered = orders.filter(order => 
        !order.fiscal_notes || order.fiscal_notes.length === 0
      );
    } else if (statusFilter === 'missing_shipment') {
      filtered = orders.filter(order => 
        !order.shipments || order.shipments.length === 0
      );
    } else if (statusFilter === 'complete') {
      filtered = orders.filter(order => {
        const hasNFe = order.fiscal_notes && order.fiscal_notes.length > 0;
        const hasShipment = order.shipments && order.shipments.length > 0;
        return hasNFe && hasShipment;
      });
    }
    
    setFilteredOrders(filtered);
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
    const nfeHasError = order.fiscal_notes?.some(
      (note: any) => note.status === 'rejected' || note.erro_message
    );
    const hasShipment = order.shipments && order.shipments.length > 0;
    
    if (nfeHasError) {
      return { status: 'error', text: 'Erro NF-e', color: 'bg-red-600', icon: XCircle };
    } else if (hasNFe && hasShipment) {
      return { status: 'complete', text: 'Completo', color: 'bg-green-500', icon: CheckCircle };
    } else if (hasShipment) {
      return { status: 'partial', text: 'Etiqueta OK', color: 'bg-yellow-500', icon: Package };
    } else if (hasNFe) {
      return { status: 'partial', text: 'NF-e OK', color: 'bg-blue-500', icon: FileText };
    }
    return { status: 'pending', text: 'Pendente', color: 'bg-orange-500', icon: AlertCircle };
  };

  if (loading) {
    return <div className="p-6">Carregando pedidos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Automação de Pedidos</h2>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar pedidos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os pedidos</SelectItem>
              <SelectItem value="nfe_error">❌ Erro na NF-e</SelectItem>
              <SelectItem value="missing_nfe">📄 Sem NF-e</SelectItem>
              <SelectItem value="missing_shipment">📦 Sem Etiqueta</SelectItem>
              <SelectItem value="complete">✅ Completos</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadRecentOrders} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>
      </div>

      <AutomationExplainer />

      <div className="grid gap-4">
        {filteredOrders.map((order) => {
          const automationStatus = getAutomationStatus(order);
          const hasNFe = order.fiscal_notes && order.fiscal_notes.length > 0;
          const nfeError = order.fiscal_notes?.find(
            (note: any) => note.status === 'rejected' || note.erro_message
          );
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
                    <Badge className={`${automationStatus.color} flex items-center gap-1`}>
                      <automationStatus.icon className="w-3 h-3" />
                      {automationStatus.text}
                    </Badge>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`flex items-center gap-1 ${hasNFe && !nfeError ? 'text-green-600' : 'text-red-600'}`}>
                        <FileText className="w-4 h-4" />
                        {hasNFe ? (nfeError ? 'NF-e Erro' : 'NF-e OK') : 'Sem NF-e'}
                      </div>
                      
                      <div className={`flex items-center gap-1 ${hasShipment ? 'text-green-600' : 'text-red-600'}`}>
                        <Package className="w-4 h-4" />
                        {hasShipment ? 'Etiqueta OK' : 'Sem Etiqueta'}
                      </div>
                    </div>
                  </div>
                </div>

                {nfeError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Erro na NF-e:</strong> {nfeError.erro_message || 'Erro desconhecido'}
                    </AlertDescription>
                  </Alert>
                )}

                {(automationStatus.status !== 'complete' || nfeError) && (
                  <div className="flex gap-2 mt-4">
                    {(!hasNFe || nfeError) && (
                      <Button
                        size="sm"
                        onClick={() => retryNFeGeneration(order.id)}
                        disabled={processingOrder === order.id}
                        className={`flex items-center gap-2 ${nfeError ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                      >
                        <FileText className="w-4 h-4" />
                        {processingOrder === order.id ? 'Processando...' : (nfeError ? 'Tentar Novamente' : 'Gerar NF-e')}
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

      {filteredOrders.length === 0 && orders.length > 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground">
              Não há pedidos com o filtro selecionado.
            </p>
          </CardContent>
        </Card>
      )}

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