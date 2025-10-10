import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Package, AlertTriangle, TrendingUp, TrendingDown, Warehouse, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardSelector, DashboardType } from '@/components/admin/DashboardSelector';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  useInventoryOverview,
  useStockLevels,
  useStockMovements,
  useInventoryTurnover,
  useLotExpirations
} from '@/hooks/useInventoryAnalytics';

const InventoryDashboard = ({ currentDashboard, setCurrentDashboard }: {
  currentDashboard: DashboardType;
  setCurrentDashboard: (dashboard: DashboardType) => void;
}) => {
  const { data: overview, isLoading: overviewLoading } = useInventoryOverview();
  const { data: stockLevels, isLoading: stockLoading } = useStockLevels();
  const { data: movements, isLoading: movementsLoading } = useStockMovements(30);
  const { data: turnover } = useInventoryTurnover(90);
  const { data: expirations } = useLotExpirations();

  const StatCard = ({ title, value, icon: Icon, subtitle, gradient, trend }: {
    title: string;
    value: string | number;
    icon: any;
    subtitle: string;
    gradient: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-full bg-gradient-to-br ${gradient}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground flex-1">{subtitle}</p>
          {trend && (
            <div className={`flex items-center ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3" />}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (overviewLoading || stockLoading || movementsLoading) {
    return <div className="text-center p-8">Carregando dados de estoque...</div>;
  }

  const movementsChartData = movements?.map(item => ({
    date: format(new Date(item.period), 'dd/MM', { locale: ptBR }),
    purchases: item.purchases_ml,
    sales: Math.abs(item.sales_ml),
    net: item.net_change_ml
  })) || [];

  const lowStockProducts = stockLevels?.filter(item => 
    item.stock_status === 'low' || item.stock_status === 'critical'
  ).slice(0, 10) || [];

  const criticalExpirations = expirations?.filter(item => 
    item.status === 'critical' || item.status === 'expired'
  ).slice(0, 5) || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard de Estoque</h2>
          <p className="text-muted-foreground">Análise completa do inventário e movimentações</p>
        </div>
        <DashboardSelector value={currentDashboard} onChange={setCurrentDashboard} />
      </div>

      {/* Inventory Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total de Produtos"
          value={overview?.total_products || 0}
          icon={Package}
          subtitle="Produtos cadastrados"
          gradient="from-blue-500 to-blue-600"
        />
        
        <StatCard
          title="Estoque Total"
          value={`${((overview?.total_stock_ml || 0) / 1000).toFixed(1)}L`}
          icon={Warehouse}
          subtitle="Volume em estoque"
          gradient="from-cyan-500 to-cyan-600"
        />
        
        <StatCard
          title="Estoque Baixo"
          value={overview?.low_stock_items || 0}
          icon={AlertTriangle}
          subtitle="Produtos com estoque baixo"
          gradient="from-yellow-500 to-yellow-600"
          trend="down"
        />

        <StatCard
          title="Sem Estoque"
          value={overview?.out_of_stock_items || 0}
          icon={AlertTriangle}
          subtitle="Produtos esgotados"
          gradient="from-red-500 to-red-600"
          trend="down"
        />
        
        <StatCard
          title="Valor do Estoque"
          value={new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL', 
            notation: 'compact' 
          }).format(overview?.total_inventory_value || 0)}
          icon={DollarSign}
          subtitle="Valor total em estoque"
          gradient="from-green-500 to-green-600"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stock Movements Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Movimentações de Estoque - Últimos 30 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={movementsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => [`${value} ml`, '']}
                />
                <Line 
                  type="monotone" 
                  dataKey="purchases" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Compras"
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Vendas"
                />
                <Line 
                  type="monotone" 
                  dataKey="net" 
                  stroke="#06b6d4" 
                  strokeWidth={3}
                  name="Saldo"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Inventory Turnover */}
        <Card>
          <CardHeader>
            <CardTitle>Giro de Estoque (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={turnover?.slice(0, 10) || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis 
                  type="category" 
                  dataKey="perfume_name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10}
                  width={120}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="turnover_rate" 
                  fill="#06b6d4"
                  radius={[0, 4, 4, 0]}
                  name="Taxa de Giro"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Products Table */}
      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Produtos com Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estoque Atual</TableHead>
                  <TableHead>Dias de Estoque</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((product) => (
                  <TableRow key={product.perfume_id}>
                    <TableCell className="font-medium">{product.perfume_name}</TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        product.stock_status === 'critical' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {product.current_stock_ml} ml
                      </span>
                    </TableCell>
                    <TableCell>{product.days_of_stock} dias</TableCell>
                    <TableCell>
                      <Badge variant={product.stock_status === 'critical' ? "destructive" : "secondary"}>
                        {product.stock_status === 'critical' ? 'Crítico' : 'Baixo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Critical Expirations */}
      {criticalExpirations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Lotes com Validade Próxima ou Vencida
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criticalExpirations.map((lot) => (
                  <TableRow key={lot.lot_id}>
                    <TableCell className="font-medium">{lot.perfume_name}</TableCell>
                    <TableCell>{lot.brand}</TableCell>
                    <TableCell>{lot.lot_code}</TableCell>
                    <TableCell>{lot.qty_ml} ml</TableCell>
                    <TableCell>
                      {format(new Date(lot.expiry_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={lot.status === 'expired' ? "destructive" : "secondary"}>
                        {lot.status === 'expired' ? 'Vencido' : `${lot.days_until_expiry} dias`}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InventoryDashboard;
