import { useState } from 'react';
import { Plus, Package, Calendar, Edit, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInventoryLots, useCreateInventoryLot, useUpdateInventoryLot } from '@/hooks/useInventoryLots';
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
  const updateLot = useUpdateInventoryLot();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<any>(null);
  const [formData, setFormData] = useState({
    perfume_id: '',
    lot_code: '',
    expiry_date: '',
    qty_ml: 0,
    warehouse_id: '',
    cost_per_ml: 0,
    supplier: '',
  });

  const resetForm = () => {
    setFormData({
      perfume_id: '',
      lot_code: '',
      expiry_date: '',
      qty_ml: 0,
      warehouse_id: '',
      cost_per_ml: 0,
      supplier: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingLot) {
        await updateLot.mutateAsync({
          id: editingLot.id,
          ...formData,
          expiry_date: formData.expiry_date || null,
          total_cost: formData.cost_per_ml * formData.qty_ml,
        });
        toast({ title: "Lote atualizado com sucesso!" });
        setEditingLot(null);
      } else {
        await createLot.mutateAsync({
          ...formData,
          expiry_date: formData.expiry_date || null,
          total_cost: formData.cost_per_ml * formData.qty_ml,
        });
        toast({ title: "Lote criado com sucesso!" });
        setIsCreateOpen(false);
      }
      resetForm();
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: editingLot ? "Ocorreu um erro ao atualizar o lote." : "Ocorreu um erro ao criar o lote.",
        variant: "destructive" 
      });
    }
  };

  const handleEdit = (lot: any) => {
    setFormData({
      perfume_id: lot.perfume_id,
      lot_code: lot.lot_code,
      expiry_date: lot.expiry_date ? format(new Date(lot.expiry_date), 'yyyy-MM-dd') : '',
      qty_ml: lot.qty_ml,
      warehouse_id: lot.warehouse_id,
      cost_per_ml: lot.cost_per_ml || 0,
      supplier: lot.supplier || '',
    });
    setEditingLot(lot);
  };

  if (lotsLoading || perfumesLoading || warehousesLoading) {
    return <div className="container mx-auto p-6">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Gerenciar Lotes</h1>
              <p className="text-muted-foreground mt-1">
                Controle de lotes de estoque e validades
              </p>
            </div>
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
                    <Label htmlFor="cost_per_ml">Custo por ML (R$)</Label>
                    <Input
                      id="cost_per_ml"
                      type="number"
                      step="0.01"
                      value={formData.cost_per_ml}
                      onChange={(e) => setFormData({ ...formData, cost_per_ml: Number(e.target.value) })}
                      placeholder="0.00"
                      min="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="supplier">Fornecedor (opcional)</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      placeholder="Nome do fornecedor"
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
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
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
                  <TableHead>Custo</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Armazém</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
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
                          <div className="font-medium">R$ {lot.cost_per_ml?.toFixed(4) || '0.0000'}/ml</div>
                          <div className="text-sm text-muted-foreground">Total: R$ {lot.total_cost?.toFixed(2) || '0.00'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lot.supplier || 'N/A'}
                      </TableCell>
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
                        {isExpired ? (
                          <Badge variant="destructive">Vencido</Badge>
                        ) : isExpiringSoon ? (
                          <Badge className="bg-orange-100 text-orange-800">Vence em breve</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(lot)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
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

        {/* Edit Dialog */}
        <Dialog open={!!editingLot} onOpenChange={() => setEditingLot(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Lote</DialogTitle>
            </DialogHeader>
            
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> Ao editar um lote, você está alterando informações que podem afetar cálculos de estoque e custos.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-perfume">Perfume</Label>
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
                <Label htmlFor="edit-lot_code">Código do Lote</Label>
                <Input
                  id="edit-lot_code"
                  value={formData.lot_code}
                  onChange={(e) => setFormData({ ...formData, lot_code: e.target.value })}
                  placeholder="Ex: LOT001"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-qty_ml">Quantidade (ml)</Label>
                <Input
                  id="edit-qty_ml"
                  type="number"
                  value={formData.qty_ml}
                  onChange={(e) => setFormData({ ...formData, qty_ml: Number(e.target.value) })}
                  min="1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-expiry_date">Data de Validade (opcional)</Label>
                <Input
                  id="edit-expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-cost_per_ml">Custo por ML (R$)</Label>
                <Input
                  id="edit-cost_per_ml"
                  type="number"
                  step="0.01"
                  value={formData.cost_per_ml}
                  onChange={(e) => setFormData({ ...formData, cost_per_ml: Number(e.target.value) })}
                  placeholder="0.00"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="edit-supplier">Fornecedor (opcional)</Label>
                <Input
                  id="edit-supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Nome do fornecedor"
                />
              </div>

              <div>
                <Label htmlFor="edit-warehouse">Armazém</Label>
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

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingLot(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={updateLot.isPending}>
                  {updateLot.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminLots;