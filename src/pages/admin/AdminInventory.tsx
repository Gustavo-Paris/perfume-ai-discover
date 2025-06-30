
import { useState } from 'react';
import { Calendar, Package, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useStockMovements } from '@/hooks/useStockMovements';
import { usePerfumes } from '@/hooks/usePerfumes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminInventory = () => {
  const [selectedPerfume, setSelectedPerfume] = useState<string>('');
  const { data: stockMovements, isLoading: movementsLoading } = useStockMovements(selectedPerfume || undefined);
  const { data: perfumes, isLoading: perfumesLoading } = usePerfumes();

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'return':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'sale':
      case 'fraction':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-blue-600" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'bg-green-100 text-green-800';
      case 'sale':
        return 'bg-red-100 text-red-800';
      case 'fraction':
        return 'bg-orange-100 text-orange-800';
      case 'return':
        return 'bg-blue-100 text-blue-800';
      case 'adjust':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMovementLabel = (type: string) => {
    const labels = {
      purchase: 'Compra',
      sale: 'Venda',
      fraction: 'Fracionamento',
      return: 'Devolução',
      adjust: 'Ajuste'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (movementsLoading || perfumesLoading) {
    return <div className="container mx-auto p-6">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Movimentações de Estoque</h1>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Perfume</label>
                <Select value={selectedPerfume} onValueChange={setSelectedPerfume}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os perfumes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os perfumes</SelectItem>
                    {perfumes?.map((perfume) => (
                      <SelectItem key={perfume.id} value={perfume.id}>
                        {perfume.brand} - {perfume.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Perfume</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Quantidade (ml)</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockMovements?.map((movement: any) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{movement.perfumes?.brand}</div>
                      <div className="text-sm text-muted-foreground">{movement.perfumes?.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {movement.inventory_lots?.lot_code || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getMovementIcon(movement.movement_type)}
                      <Badge className={getMovementColor(movement.movement_type)}>
                        {getMovementLabel(movement.movement_type)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={movement.change_ml > 0 ? 'text-green-600' : 'text-red-600'}>
                      {movement.change_ml > 0 ? '+' : ''}{movement.change_ml} ml
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {movement.notes || '-'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {stockMovements?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma movimentação encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInventory;
