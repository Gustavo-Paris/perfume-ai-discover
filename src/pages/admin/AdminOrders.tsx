import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Search, 
  Filter, 
  FileText, 
  Package, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  RefreshCw,
  Zap,
  Download,
  Truck,
  Bot
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { OrderDetailsModal } from '@/components/orders/OrderDetailsModal';
import { SystemNotifications } from '@/components/admin/SystemNotifications';

interface OrderProfile {
  name: string;
  email: string;
}

interface OrderWithAutomation {
  id: string;
  order_number: string;
  user_id: string;
  total_amount: number;
  subtotal: number;
  shipping_cost: number;  
  status: string;
  payment_method: string;  
  payment_status: string;
  shipping_service?: string;
  address_data: any;
  created_at: string;
  profiles?: OrderProfile | null;
  fiscal_notes?: any[];
  shipments?: any[];
}

const AdminOrders = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [automationFilter, setAutomationFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const itemsPerPage = 15;

  const { data: ordersResult, isLoading, refetch } = useQuery({
    queryKey: ['unified-orders', searchTerm, statusFilter, automationFilter, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          user_id,
          total_amount,
          subtotal,
          shipping_cost,
          status,
          payment_method,
          payment_status,
          shipping_service,
          address_data,
          created_at,
          fiscal_notes (*),
          shipments (*)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('order_number', `%${searchTerm}%`);
      }

      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'paid_only') {
          query = query.eq('payment_status', 'paid');
        } else {
          query = query.eq('status', statusFilter);
        }
      }

      const { data: orders, error, count } = await query.range(from, to);
      
      if (error) throw error;
      
      // Get profiles separately
      if (orders && orders.length > 0) {
        const userIds = orders.map(order => order.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds);
        
        // Attach profiles to orders and filter by automation status
        let ordersWithProfiles = orders.map(order => ({
          ...order,
          profiles: profiles?.find(p => p.id === order.user_id) || null
        }));

        // Apply automation filter
        if (automationFilter !== 'all') {
          ordersWithProfiles = ordersWithProfiles.filter(order => {
            const hasNFE = order.fiscal_notes && order.fiscal_notes.length > 0;
            const hasShipment = order.shipments && order.shipments.length > 0;
            
            switch (automationFilter) {
              case 'complete':
                return hasNFE && hasShipment;
              case 'needs_action':
                return !hasNFE || !hasShipment;
              case 'nfe_missing':
                return !hasNFE;
              case 'label_missing':
                return hasNFE && !hasShipment;
              default:
                return true;
            }
          });
        }
        
        return { data: ordersWithProfiles, count: count || 0 };
      }
      
      return { data: orders || [], count: count || 0 };
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const orders = ordersResult?.data || [];
  const totalPages = Math.ceil((ordersResult?.count || 0) / itemsPerPage);

  // Get automation statistics
  const automationStats = {
    total: orders.length,
    complete: orders.filter(order => {
      const hasNFE = order.fiscal_notes && order.fiscal_notes.length > 0;
      const hasShipment = order.shipments && order.shipments.length > 0;
      return hasNFE && hasShipment;
    }).length,
    needsAction: orders.filter(order => {
      const hasNFE = order.fiscal_notes && order.fiscal_notes.length > 0;
      const hasShipment = order.shipments && order.shipments.length > 0;
      return !hasNFE || !hasShipment;
    }).length,
    paidOrders: orders.filter(order => order.payment_status === 'paid').length
  };

  const getAutomationStatus = (order: OrderWithAutomation) => {
    const hasNFE = order.fiscal_notes && order.fiscal_notes.length > 0;
    const hasShipment = order.shipments && order.shipments.length > 0;
    const isPaid = order.payment_status === 'paid';
    
    if (!isPaid) {
      return { status: 'pending_payment', text: 'Aguardando Pagamento', color: 'bg-gray-500', icon: Clock };
    } else if (hasNFE && hasShipment) {
      return { status: 'complete', text: 'Completo ✓', color: 'bg-green-500', icon: CheckCircle };
    } else if (hasNFE && !hasShipment) {
      return { status: 'need_label', text: 'Precisa Etiqueta', color: 'bg-yellow-500', icon: Package };
    } else if (!hasNFE) {
      return { status: 'need_nfe', text: 'Precisa NF-e', color: 'bg-orange-500', icon: FileText };
    } else {
      return { status: 'processing', text: 'Processando', color: 'bg-blue-500', icon: Zap };
    }
  };

  const handleAutomaticNFE = async (orderId: string) => {
    setProcessingOrder(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-nfe', {
        body: { order_id: orderId }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "🤖 NF-e Gerada Automaticamente",
          description: "A nota fiscal foi gerada e o sistema prosseguirá com a etiqueta.",
        });
        
        // Trigger automatic label creation after NF-e
        setTimeout(() => handleAutomaticLabel(orderId), 2000);
        
        refetch();
      } else {
        throw new Error(data.error || 'Erro ao gerar NF-e');
      }
    } catch (error) {
      console.error('Error generating NF-e:', error);
      toast({
        title: "❌ Erro na Automação",
        description: error instanceof Error ? error.message : "Falha na geração automática de NF-e",
        variant: "destructive",
      });
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleAutomaticLabel = async (orderId: string) => {
    if (processingOrder && processingOrder !== orderId) return;
    
    setProcessingOrder(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('me-buy-label', {
        body: { orderId }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "🤖 Etiqueta Criada Automaticamente",
          description: "Etiqueta gerada! Pedido processado completamente.",
        });
        refetch();
      } else {
        throw new Error(data.error || 'Erro ao criar etiqueta');
      }
    } catch (error) {
      console.error('Error creating label:', error);
      toast({
        title: "❌ Erro na Automação",
        description: error instanceof Error ? error.message : "Falha na criação automática de etiqueta",
        variant: "destructive",
      });
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleDownloadLabel = async (order: OrderWithAutomation) => {
    if (order.shipments && order.shipments.length > 0 && order.shipments[0].pdf_url) {
      window.open(order.shipments[0].pdf_url, '_blank');
    } else {
      toast({
        title: "PDF não disponível",
        description: "Etiqueta ainda não foi gerada ou PDF não está disponível.",
        variant: "destructive",
      });
    }
  };

  const openDetails = async (orderId: string) => {
    setDetailsOpen(true);
    setLoadingDetails(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*, perfumes(id, name, brand, image_url)),
        shipments(*),
        fiscal_notes(*)
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (error || !data) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes do pedido.',
        variant: 'destructive',
      });
      setLoadingDetails(false);
      return;
    }

    const mappedItems = (data.order_items || []).map((oi: any) => ({
      ...oi,
      perfume: oi.perfumes ? {
        id: oi.perfumes.id,
        name: oi.perfumes.name,
        brand: oi.perfumes.brand,
        image_url: oi.perfumes.image_url,
      } : undefined,
    }));

    setDetailOrder({
      ...data,
      order_items: mappedItems,
    });
    setLoadingDetails(false);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Zap className="w-8 h-8 mx-auto mb-4 text-primary animate-pulse" />
              <div>Carregando sistema inteligente de pedidos...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            Sistema Inteligente de Pedidos
          </h1>
          <p className="text-muted-foreground">
            Gestão automatizada e unificada de pedidos, NF-e e logística
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      <SystemNotifications />

      {/* Automation Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                <p className="text-2xl font-bold">{automationStats.total}</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pedidos Pagos</p>
                <p className="text-2xl font-bold text-green-600">{automationStats.paidOrders}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processados</p>
                <p className="text-2xl font-bold text-green-600">{automationStats.complete}</p>
              </div>
              <Bot className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Precisam Ação</p>
                <p className="text-2xl font-bold text-orange-600">{automationStats.needsAction}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar Pedido</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Nº do pedido ou cliente"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status do Pedido</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="paid_only">🔥 Apenas Pagos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="shipped">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status da Automação</label>
              <Select value={automationFilter} onValueChange={setAutomationFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="complete">✅ Completos</SelectItem>
                  <SelectItem value="needs_action">⚠️ Precisam Ação</SelectItem>
                  <SelectItem value="nfe_missing">📄 Falta NF-e</SelectItem>
                  <SelectItem value="label_missing">📦 Falta Etiqueta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ações</label>
              <Button onClick={() => setCurrentPage(1)} className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido & Status</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Automação</TableHead>
                <TableHead>Valores</TableHead>
                <TableHead>Ações Inteligentes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => {
                const automationStatus = getAutomationStatus(order);
                const isProcessing = processingOrder === order.id;
                const hasNFE = order.fiscal_notes && order.fiscal_notes.length > 0;
                const hasShipment = order.shipments && order.shipments.length > 0;
                const isPaid = order.payment_status === 'paid';
                const StatusIcon = automationStatus.icon;
                
                return (
                  <TableRow key={order.id} className={isPaid ? "bg-green-50/30" : ""}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          <StatusIcon className="w-4 h-4" />
                          {order.order_number}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <Badge className={automationStatus.color + " text-white text-xs"}>
                          {automationStatus.text}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <div className="font-medium">{(order as OrderWithAutomation).profiles?.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{(order as OrderWithAutomation).profiles?.email || 'N/A'}</div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className={`flex items-center gap-1 text-sm ${hasNFE ? 'text-green-600' : 'text-red-600'}`}>
                          <FileText className="w-4 h-4" />
                          {hasNFE ? '✓ NF-e' : '✗ NF-e'}
                        </div>
                        <div className={`flex items-center gap-1 text-sm ${hasShipment ? 'text-green-600' : 'text-red-600'}`}>
                          <Package className="w-4 h-4" />
                          {hasShipment ? '✓ Etiqueta' : '✗ Etiqueta'}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(order.total_amount)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.payment_status === 'paid' ? '✓ Pago' : 'Pendente'}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-1">
                        {isPaid && !hasNFE && (
                          <Button
                            size="sm"
                            onClick={() => handleAutomaticNFE(order.id)}
                            disabled={isProcessing}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                          >
                            {isProcessing ? (
                              <Zap className="w-4 h-4 animate-pulse" />
                            ) : (
                              <>
                                <Bot className="w-4 h-4" />
                                NF-e
                              </>
                            )}
                          </Button>
                        )}
                        
                        {isPaid && hasNFE && !hasShipment && (
                          <Button
                            size="sm"
                            onClick={() => handleAutomaticLabel(order.id)}
                            disabled={isProcessing}
                            className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
                          >
                            {isProcessing ? (
                              <Zap className="w-4 h-4 animate-pulse" />
                            ) : (
                              <>
                                <Bot className="w-4 h-4" />
                                Etiqueta
                              </>
                            )}
                          </Button>
                        )}

                        {hasShipment && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadLabel(order)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetails(order.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {orders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Sistema Pronto para Automação</h3>
            <p className="text-muted-foreground">
              Assim que houver pedidos pagos, o sistema processará automaticamente NF-e e etiquetas.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="flex items-center px-4">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Próximo
          </Button>
        </div>
      )}

      <OrderDetailsModal
        order={detailOrder}
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  );
};

export default AdminOrders;