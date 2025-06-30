
import { useState } from 'react';
import { Plus, Package, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useInventoryLots, useCreateInventoryLot } from '@/hooks/useInventoryLots';
import { usePerfumes } from '@/hooks/usePerfumes';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminLots = () => {
  const { data: lots, isLoading: lotsLoading } = useInventoryLots();
  const { data: perfumes, isLoading: perfumesLoading } = usePerfumes();
  const { data: warehouses, isLoading: warehousesLoading } = useWarehouses();
  const createLot = useCreateInventoryLot();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    perfume_id: '',
    lot_code: '',
    expiry_date: '',
    qty_ml: 0,
    warehouse_id: '',
  });

  const resetForm = () => {
    setFormData({
      perfume_id: '',
      lot_code: '',
      expiry_date: '',
      qty_ml: 0,
      warehouse_id: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createLot.mutateAsync({
        ...formData,
        expiry_date: formData.expiry_date || null,
      });
      toast({ title: "Lote criado com sucesso!" });
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Ocorreu um erro ao criar o lote.",
        variant: "destructive" 
      });
    }
  };

  if (lotsLoading || perfumesLoading || warehousesLoading) {
    return <div className="container mx-auto p-6">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gerenciar Lotes</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lote
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Lote</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="perfume">Perfume</Label>
                <Select value={formData.perfume_id} onValueChange={(value) => setFormData({ ...formData, perfume_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um perfume" />
                  </SelectTrigger>
                  <SelectContent>
                    {perfumes?.map((perfume) => (
                      <SelectItem key={perfume.id} value={perfume.id}>
                        {perfume.brand} - {perfume.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="lot_code">Código do Lote</Label>
                <Input
                  id="lot_code"
                  value={formData.lot_code}
                  onChange={(e) => setFormData({ ...formData, lot_code: e.target.value })}
                  placeholder="Ex: LOT001"
                  required
                />
              </div>

              <div>
                <Label htmlFor="qty_ml">Quantidade (ml)</Label>
                <Input
                  id="qty_ml"
                  type="number"
                  value={formData.qty_ml}
                  onChange={(e) => setFormData({ ...formData, qty_ml: Number(e.target.value) })}
                  min="1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="expiry_date">Data de Validade (opcional)</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="warehouse">Armazém</Label>
                <Select value={formData.warehouse_id} onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um armazém" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses?.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} - {warehouse.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={createLot.isPending}>
                {createLot.isPending ? 'Criando...' : 'Criar Lote'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Lotes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código do Lote</TableHead>
                <TableHead>Perfume</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Armazém</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lots?.map((lot: any) => {
                const isExpiringSoon = lot.expiry_date && 
                  new Date(lot.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                const isExpired = lot.expiry_date && new Date(lot.expiry_date) < new Date();
                
                return (
                  <TableRow key={lot.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{lot.lot_code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lot.perfumes?.brand}</div>
                        <div className="text-sm text-muted-foreground">{lot.perfumes?.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{lot.qty_ml} ml</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lot.warehouses?.name}</div>
                        <div className="text-sm text-muted-foreground">{lot.warehouses?.location}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {lot.expiry_date ? (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className={isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : ''}>
                            {format(new Date(lot.expiry_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(lot.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {isExpired ? (
                        <Badge variant="destructive">Vencido</Badge>
                      ) : isExpiringSoon ? (
                        <Badge className="bg-orange-100 text-orange-800">Vence em breve</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {lots?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum lote encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLots;
