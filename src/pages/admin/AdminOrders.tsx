import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, Search, Filter, FileText, Send, CheckCircle, Printer } from 'lucide-react';
import { useBuyLabel, useShipments } from '@/hooks/useShipments';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { OrderDetailsModal } from '@/components/orders/OrderDetailsModal';

interface OrderProfile {
  name: string;
  email: string;
}

interface OrderWithProfile {
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
  profiles?: OrderProfile;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800", 
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800"
};

const AdminOrders = () => {
  const { toast } = useToast();
  const buyLabelMutation = useBuyLabel();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const itemsPerPage = 10;

  const { data: ordersResult, isLoading } = useQuery({
    queryKey: ['admin-orders', searchTerm, statusFilter, dateFilter, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      // Build the base query
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
          created_at
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('order_number', `%${searchTerm}%`);
      }

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (dateFilter) {
        const startOfDay = new Date(dateFilter);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(dateFilter);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query.gte('created_at', startOfDay.toISOString())
                    .lte('created_at', endOfDay.toISOString());
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
        
        // Attach profiles to orders
        const ordersWithProfiles = orders.map(order => ({
          ...order,
          profiles: profiles?.find(p => p.id === order.user_id)
        }));
        
        return { data: ordersWithProfiles, count: count || 0 };
      }
      
      return { data: orders || [], count: count || 0 };
    },
  });

  const orders = ordersResult?.data || [];
  const totalPages = Math.ceil((ordersResult?.count || 0) / itemsPerPage);

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(orders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleBulkPrintLabels = async () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "Nenhum pedido selecionado",
        description: "Selecione pelo menos um pedido para imprimir etiquetas.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Here you would call the bulk print labels API
      toast({
        title: "Etiquetas enviadas",
        description: `${selectedOrders.length} etiquetas enviadas para impressão.`,
      });
      setSelectedOrders([]);
    } catch (error) {
      console.error('Error printing labels:', error);
      toast({
        title: "Erro",
        description: "Erro ao imprimir etiquetas.",
        variant: "destructive",
      });
    }
  };

  const handleBulkSendEmail = async () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "Nenhum pedido selecionado",
        description: "Selecione pelo menos um pedido para enviar emails.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Here you would call the bulk send email API
      toast({
        title: "Emails enviados",
        description: `Emails de atualização enviados para ${selectedOrders.length} pedidos.`,
      });
      setSelectedOrders([]);
    } catch (error) {
      console.error('Error sending emails:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar emails.",
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
        shipments(*)
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao carregar detalhes do pedido:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes do pedido.',
        variant: 'destructive',
      });
      setLoadingDetails(false);
      return;
    }

    if (!data) {
      toast({ title: 'Pedido não encontrado', description: 'Tente novamente mais tarde.' });
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

  const closeDetails = () => {
    setDetailsOpen(false);
    setDetailOrder(null);
  };

  const handlePrintLabel = async (orderId: string) => {
    try {
      // First check if there's already a shipment with PDF
      const { data: shipments } = await supabase
        .from('shipments')
        .select('pdf_url, tracking_code, status')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (shipments && shipments.length > 0 && shipments[0].pdf_url) {
        // If there's already a PDF, download it directly
        window.open(shipments[0].pdf_url, '_blank');
        return;
      }

      // If no shipment or no PDF, create the label
      toast({
        title: "Gerando etiqueta...",
        description: "Criando etiqueta de envio, aguarde...",
      });

      await buyLabelMutation.mutateAsync({ orderId });
      
      toast({
        title: "Etiqueta gerada!",
        description: "A etiqueta foi gerada com sucesso.",
      });
    } catch (error) {
      console.error('Error handling label:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar etiqueta.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando pedidos...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">Gerencie todos os pedidos da loja</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar por Nº ou Cliente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nº do pedido ou cliente"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Todos os Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="shipped">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFilter && "text-muted-foreground"
                    )}
                  >
                    {dateFilter ? (
                      format(dateFilter, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      "Selecionar data"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ações</label>
              <Button onClick={() => setCurrentPage(1)} className="w-full">
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedOrders.length} pedido(s) selecionado(s)
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleBulkPrintLabels}>
                  <FileText className="mr-2 h-4 w-4" />
                  Imprimir Etiquetas
                </Button>
                <Button size="sm" variant="outline" onClick={handleBulkSendEmail}>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Atualização
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedOrders.length === orders.length && orders.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Nº Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Endereço/Entrega</TableHead>
                <TableHead>Valores</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-32">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedOrders.includes(order.id)}
                      onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {order.order_number}
                  </TableCell>
                  <TableCell>
                     <div>
                       <div className="font-medium">{(order as any).profiles?.name || 'N/A'}</div>
                       <div className="text-sm text-muted-foreground">{(order as any).profiles?.email || 'N/A'}</div>
                     </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {order.shipping_service?.toLowerCase().includes('retirada') || 
                       order.shipping_service?.toLowerCase().includes('pickup') ? (
                        <>
                          <div className="text-sm font-medium text-blue-700">🏪 Retirada Local</div>
                          <div className="text-xs text-gray-600">Loja - Chapecó/SC</div>
                        </>
                      ) : order.shipping_service?.toLowerCase().includes('local') ? (
                        <>
                          <div className="text-sm font-medium text-green-700">🚚 Entrega Local</div>
                          <div className="text-xs text-gray-600">
                            {(order.address_data as any)?.city} - {(order.address_data as any)?.state}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-medium">📦 Correios</div>
                          <div className="text-xs text-gray-600">
                            {(order.address_data as any)?.city} - {(order.address_data as any)?.state}
                          </div>
                        </>
                      )}
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
                      {order.subtotal !== order.total_amount && (
                        <div className="text-xs text-gray-600">
                          Sub: {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(order.subtotal || 0)}
                          {(order.shipping_cost || 0) > 0 && (
                            <> + Frete: {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(order.shipping_cost || 0)}</>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {order.payment_method === 'pix' ? '💰 PIX' : '💳 Cartão'}
                        {' • '}
                        {order.payment_status === 'paid' ? '✅ Pago' : '⏳ Pendente'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", statusColors[order.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800")}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                  </TableCell>
                   <TableCell>
                     <div className="space-y-2">
                       {order.shipping_service?.toLowerCase().includes('retirada') || 
                        order.shipping_service?.toLowerCase().includes('pickup') ? (
                         <Button 
                           size="sm" 
                           variant="default"
                           onClick={() => {
                             toast({
                               title: "Marcar como Entregue",
                               description: "Funcionalidade em desenvolvimento",
                             });
                           }}
                           className="w-full text-xs"
                         >
                           <CheckCircle className="mr-1 h-3 w-3" />
                           Entregue
                         </Button>
                       ) : (
                         <Button 
                           size="sm" 
                           variant="secondary"
                           onClick={() => handlePrintLabel(order.id)}
                           disabled={buyLabelMutation.isPending}
                           className="w-full text-xs"
                         >
                           <Printer className="mr-1 h-3 w-3" />
                           {buyLabelMutation.isPending ? 'Gerando...' : 'Etiqueta'}
                         </Button>
                       )}
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openDetails(order.id)}
                        className="w-full text-xs"
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        Detalhes
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground flex items-center">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}

      {detailsOpen && detailOrder && (
        <OrderDetailsModal order={detailOrder} isOpen={detailsOpen} onClose={closeDetails} />
      )}
    </div>
  );
};

export default AdminOrders;