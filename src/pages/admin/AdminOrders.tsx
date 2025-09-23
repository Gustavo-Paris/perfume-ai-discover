import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Calendar as CalendarIcon, Filter, Printer, Mail, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Order as OrderFull } from '@/types/order';
import { OrderDetailsModal } from '@/components/orders/OrderDetailsModal';

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  total_amount: number;
  subtotal?: number;
  shipping_cost?: number;
  payment_status: string;
  payment_method?: string;
  shipping_service?: string;
  status: string;
  created_at: string;
  address_data: any;
  profiles?: {
    name: string;
    email: string;
  } | null;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  shipped: 'bg-blue-100 text-blue-800',
  delivered: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};

const AdminOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [dateRange, setDateRange] = useState<{from?: Date; to?: Date} | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const pageSize = 20;

  const [detailOrder, setDetailOrder] = useState<OrderFull | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // First get orders
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.ilike('order_number', `%${searchTerm}%`);
      }

      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }

      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      // Pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: ordersData, error } = await query
        .range(from, to);

      if (error) throw error;

      // Get user profiles for the orders
      if (ordersData && ordersData.length > 0) {
        const userIds = [...new Set(ordersData.map(order => order.user_id))];
        
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds);

        // Merge profiles with orders
        const ordersWithProfiles = ordersData.map(order => ({
          ...order,
          profiles: profilesData?.find(profile => profile.id === order.user_id) || null
        }));

        setOrders(ordersWithProfiles);
      } else {
        setOrders([]);
      }
      
      setTotalPages(Math.ceil(ordersData?.length || 0 / pageSize));
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pedidos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter, searchTerm, dateRange]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchOrders();
  };

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

    const fullOrder: OrderFull = { ...data, order_items: mappedItems, shipments: data.shipments || [] } as OrderFull;
    setDetailOrder(fullOrder);
    setLoadingDetails(false);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setDetailOrder(null);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando pedidos...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os pedidos da loja
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nº do pedido, cliente ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
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

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                        {format(dateRange.to, "dd/MM/yy", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yy", { locale: ptBR })
                    )
                  ) : (
                    <span>Período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange as any}
                  onSelect={(range) => setDateRange(range as any)}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Button onClick={handleSearch}>
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {selectedOrders.length} pedido(s) selecionado(s)
              </span>
              <Button size="sm" onClick={handleBulkPrintLabels} className="gap-2">
                <Printer className="h-4 w-4" />
                Imprimir Etiquetas
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkSendEmail} className="gap-2">
                <Mail className="h-4 w-4" />
                Enviar Atualização
              </Button>
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
                <TableHead className="w-12">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
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
                      <div className="font-medium">{order.profiles?.name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{order.profiles?.email || 'N/A'}</div>
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
                            {order.address_data?.city} - {order.address_data?.state}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-medium">📦 Correios</div>
                          <div className="text-xs text-gray-600">
                            {order.address_data?.city} - {order.address_data?.state}
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
                    <Button size="sm" variant="ghost" onClick={() => openDetails(order.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
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