import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Package, AlertTriangle, TrendingUp, TrendingDown, Warehouse, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardSelector, DashboardType } from '@/components/admin/DashboardSelector';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface InventoryStats {
  totalProducts: number;
  lowStockProducts: number;
  totalStockValue: number;
  totalMovements: number;
  incomingMovements: number;
  outgoingMovements: number;
}

interface ProductStock {
  id: string;
  name: string;
  brand: string;
  totalStock: number;
  stockValue: number;
  isLowStock: boolean;
}

interface MovementData {
  date: string;
  incoming: number;
  outgoing: number;
  net: number;
}

const InventoryDashboard = ({ currentDashboard, setCurrentDashboard }: {
  currentDashboard: DashboardType;
  setCurrentDashboard: (dashboard: DashboardType) => void;
}) => {
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    lowStockProducts: 0,
    totalStockValue: 0,
    totalMovements: 0,
    incomingMovements: 0,
    outgoingMovements: 0
  });
  const [productsStock, setProductsStock] = useState<ProductStock[]>([]);
  const [movementsData, setMovementsData] = useState<MovementData[]>([]);
  const [warehouseData, setWarehouseData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

        // Get products with stock calculations
        const { data: products } = await supabase
          .from('perfumes')
          .select('id, name, brand, price_full');

        // Get inventory lots
        const { data: lots } = await supabase
          .from('inventory_lots')
          .select('perfume_id, qty_ml, warehouse_id');

        // Get stock movements from last 30 days
        const { data: movements } = await supabase
          .from('stock_movements')
          .select('change_ml, movement_type, created_at, perfume_id')
          .gte('created_at', thirtyDaysAgo);

        // Get warehouses
        const { data: warehouses } = await supabase
          .from('warehouses')
          .select('*');

        // Calculate product stocks
        const productStocks: ProductStock[] = [];
        let totalStockValue = 0;
        let lowStockCount = 0;

        products?.forEach(product => {
          // Calculate total stock from lots
          const productLots = lots?.filter(lot => lot.perfume_id === product.id) || [];
          const totalStock = productLots.reduce((sum, lot) => sum + lot.qty_ml, 0);
          
          // Calculate stock value (assuming price per ml)
          const stockValue = (totalStock / 100) * product.price_full; // Assuming 100ml bottles
          totalStockValue += stockValue;

          // Check if low stock (less than 500ml)
          const isLowStock = totalStock < 500;
          if (isLowStock) lowStockCount++;

          productStocks.push({
            id: product.id,
            name: product.name,
            brand: product.brand,
            totalStock,
            stockValue,
            isLowStock
          });
        });

        // Sort by stock level (low stock first)
        productStocks.sort((a, b) => a.totalStock - b.totalStock);
        setProductsStock(productStocks.slice(0, 10)); // Top 10 for display

        // Calculate movement stats
        const incomingMovements = movements?.filter(m => m.change_ml > 0).length || 0;
        const outgoingMovements = movements?.filter(m => m.change_ml < 0).length || 0;

        setStats({
          totalProducts: products?.length || 0,
          lowStockProducts: lowStockCount,
          totalStockValue,
          totalMovements: movements?.length || 0,
          incomingMovements,
          outgoingMovements
        });

        // Movements by day
        const dailyMovements = new Map();
        for (let i = 29; i >= 0; i--) {
          const date = subDays(new Date(), i);
          const dateStr = format(date, 'yyyy-MM-dd');
          dailyMovements.set(dateStr, {
            date: format(date, 'dd/MM', { locale: ptBR }),
            incoming: 0,
            outgoing: 0,
            net: 0
          });
        }

        movements?.forEach(movement => {
          const dateStr = format(new Date(movement.created_at), 'yyyy-MM-dd');
          if (dailyMovements.has(dateStr)) {
            const dayData = dailyMovements.get(dateStr);
            if (movement.change_ml > 0) {
              dayData.incoming += movement.change_ml;
            } else {
              dayData.outgoing += Math.abs(movement.change_ml);
            }
            dayData.net = dayData.incoming - dayData.outgoing;
          }
        });

        setMovementsData(Array.from(dailyMovements.values()));

        // Warehouse distribution
        const warehouseStats = warehouses?.map(warehouse => {
          const warehouseLots = lots?.filter(lot => lot.warehouse_id === warehouse.id) || [];
          const totalStock = warehouseLots.reduce((sum, lot) => sum + lot.qty_ml, 0);
          return {
            name: warehouse.name,
            stock: totalStock,
            color: warehouse.is_primary ? '#10b981' : '#06b6d4'
          };
        }) || [];

        setWarehouseData(warehouseStats);
      } catch (error) {
        console.error('Error fetching inventory data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
  }, []);

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

  if (loading) {
    return <div className="text-center p-8">Carregando dados de estoque...</div>;
  }

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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
        <StatCard
          title="Total de Produtos"
          value={stats.totalProducts}
          icon={Package}
          subtitle="Produtos cadastrados"
          gradient="from-blue-500 to-blue-600"
        />
        
        <StatCard
          title="Estoque Baixo"
          value={stats.lowStockProducts}
          icon={AlertTriangle}
          subtitle="Produtos < 500ml"
          gradient="from-red-500 to-red-600"
          trend="down"
        />
        
        <StatCard
          title="Valor do Estoque"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(stats.totalStockValue)}
          icon={TrendingUp}
          subtitle="Valor total em estoque"
          gradient="from-green-500 to-green-600"
        />
        
        <StatCard
          title="Movimentações"
          value={stats.totalMovements}
          icon={ShoppingCart}
          subtitle="Últimos 30 dias"
          gradient="from-purple-500 to-purple-600"
        />
        
        <StatCard
          title="Entradas"
          value={stats.incomingMovements}
          icon={TrendingUp}
          subtitle="Reposições de estoque"
          gradient="from-cyan-500 to-cyan-600"
          trend="up"
        />
        
        <StatCard
          title="Saídas"
          value={stats.outgoingMovements}
          icon={TrendingDown}
          subtitle="Vendas e ajustes"
          gradient="from-orange-500 to-orange-600"
          trend="down"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Stock Movements Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Movimentações de Estoque - Últimos 30 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={movementsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value, name) => [
                    `${value} ml`,
                    name === 'incoming' ? 'Entradas' : name === 'outgoing' ? 'Saídas' : 'Saldo'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="incoming" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Entradas"
                />
                <Line 
                  type="monotone" 
                  dataKey="outgoing" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Saídas"
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

        {/* Warehouse Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Armazém</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={warehouseData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="stock"
                  >
                    {warehouseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} ml`, 'Estoque']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {warehouseData.map((warehouse) => (
                  <div key={warehouse.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: warehouse.color }}
                      />
                      <span>{warehouse.name}</span>
                    </div>
                    <span className="font-medium">{warehouse.stock.toLocaleString()} ml</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Produtos com Estoque Baixo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Estoque Atual</TableHead>
                <TableHead>Valor em Estoque</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsStock.slice(0, 8).map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.brand}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${product.totalStock < 200 ? 'text-red-600' : product.totalStock < 500 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {product.totalStock} ml
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.stockValue)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.totalStock < 200 ? "destructive" : product.totalStock < 500 ? "secondary" : "default"}>
                      {product.totalStock < 200 ? 'Crítico' : product.totalStock < 500 ? 'Baixo' : 'Normal'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryDashboard;