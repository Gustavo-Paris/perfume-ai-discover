import { useState } from 'react';
import { Plus, Package, AlertTriangle, Boxes, Tags } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useMaterials, useCreateMaterial, useMaterialLots, useCreateMaterialLot, usePackagingRules, useCreatePackagingRule } from '@/hooks/useMaterials';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminMaterialsSimplified() {
  const [isCreateMaterialOpen, setIsCreateMaterialOpen] = useState(false);
  const [isCreateLotOpen, setIsCreateLotOpen] = useState(false);
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);

  const { data: materials = [], isLoading: materialsLoading } = useMaterials();
  const { data: materialLots = [], isLoading: lotsLoading } = useMaterialLots();
  const { data: packagingRules = [], isLoading: rulesLoading } = usePackagingRules();

  const createMaterial = useCreateMaterial();
  const createMaterialLot = useCreateMaterialLot();
  const createPackagingRule = useCreatePackagingRule();

  const [materialForm, setMaterialForm] = useState({
    name: '',
    type: 'input' as 'input' | 'asset',
    category: '',
    unit: '',
    cost_per_unit: 0,
    current_stock: 0,
    min_stock_alert: 0,
    supplier: '',
    description: '',
    is_active: true,
  });

  const [lotForm, setLotForm] = useState({
    material_id: '',
    quantity: 0,
    cost_per_unit: 0,
    total_cost: 0,
    supplier: '',
    purchase_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    lot_code: '',
    notes: '',
  });

  const [ruleForm, setRuleForm] = useState({
    container_material_id: '',
    max_items: 6,
    item_size_ml: null as number | null,
    priority: 1,
    is_active: true,
  });

  const handleCreateMaterial = async () => {
    try {
      await createMaterial.mutateAsync(materialForm);
      toast.success('Material criado com sucesso!');
      setIsCreateMaterialOpen(false);
      setMaterialForm({
        name: '',
        type: 'input',
        category: '',
        unit: '',
        cost_per_unit: 0,
        current_stock: 0,
        min_stock_alert: 0,
        supplier: '',
        description: '',
        is_active: true,
      });
    } catch (error) {
      toast.error('Erro ao criar material');
    }
  };

  const handleCreateLot = async () => {
    try {
      await createMaterialLot.mutateAsync(lotForm);
      toast.success('Lote de material criado com sucesso!');
      setIsCreateLotOpen(false);
      setLotForm({
        material_id: '',
        quantity: 0,
        cost_per_unit: 0,
        total_cost: 0,
        supplier: '',
        purchase_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        lot_code: '',
        notes: '',
      });
    } catch (error) {
      toast.error('Erro ao criar lote de material');
    }
  };

  const handleCreateRule = async () => {
    try {
      await createPackagingRule.mutateAsync(ruleForm);
      toast.success('Regra de embalagem criada com sucesso!');
      setIsCreateRuleOpen(false);
      setRuleForm({
        container_material_id: '',
        max_items: 6,
        item_size_ml: null,
        priority: 1,
        is_active: true,
      });
    } catch (error) {
      toast.error('Erro ao criar regra de embalagem');
    }
  };

  const inputMaterials = materials.filter(m => m.type === 'input');
  const packagingMaterials = inputMaterials.filter(m => ['frasco', 'etiqueta', 'caixa'].includes(m.category));
  const otherMaterials = inputMaterials.filter(m => !['frasco', 'etiqueta', 'caixa'].includes(m.category));
  const lowStockMaterials = materials.filter(m => m.current_stock <= m.min_stock_alert);

  if (materialsLoading || lotsLoading || rulesLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Materiais e Estoque</h1>
          <p className="text-muted-foreground mt-2">
            Sistema simplificado de gestão de materiais
          </p>
        </div>
      </div>

      {/* Alert for Low Stock */}
      {lowStockMaterials.length > 0 && (
        <Card className="border-warning bg-warning/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Estoque Baixo - {lowStockMaterials.length} materiais precisam de reposição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {lowStockMaterials.map(material => (
                <div key={material.id} className="flex justify-between items-center text-sm p-2 bg-background rounded border">
                  <span className="font-medium">{material.name}</span>
                  <Badge variant="outline" className="text-warning">
                    {material.current_stock} {material.unit}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Packaging Materials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Embalagens ({packagingMaterials.length})
            </CardTitle>
            <CardDescription>Frascos, etiquetas e caixas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {packagingMaterials.map(material => (
              <div key={material.id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <p className="font-medium text-sm">{material.name}</p>
                  <p className="text-xs text-muted-foreground">{material.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">R$ {material.cost_per_unit.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {material.current_stock} {material.unit}
                  </p>
                </div>
              </div>
            ))}
            <Dialog open={isCreateMaterialOpen} onOpenChange={setIsCreateMaterialOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Material
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo Material</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={materialForm.name}
                      onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                      placeholder="Ex: Frasco 5ml"
                    />
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <Select
                      value={materialForm.category}
                      onValueChange={(value) => setMaterialForm({ ...materialForm, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="frasco">Frasco</SelectItem>
                        <SelectItem value="etiqueta">Etiqueta</SelectItem>
                        <SelectItem value="caixa">Caixa</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Unidade</Label>
                      <Input
                        value={materialForm.unit}
                        onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })}
                        placeholder="unidade"
                      />
                    </div>
                    <div>
                      <Label>Custo (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={materialForm.cost_per_unit}
                        onChange={(e) => setMaterialForm({ ...materialForm, cost_per_unit: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateMaterialOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateMaterial} disabled={createMaterial.isPending}>
                      {createMaterial.isPending ? 'Criando...' : 'Criar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Recent Lots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5" />
              Lotes Recentes ({materialLots.length})
            </CardTitle>
            <CardDescription>Últimos lotes cadastrados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {materialLots.slice(0, 4).map(lot => {
              return (
                <div key={lot.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="font-medium text-sm">{lot.materials?.name || 'Material não encontrado'}</p>
                    <p className="text-xs text-muted-foreground">Lote: {lot.lot_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{lot.quantity} {lot.materials?.unit || 'un'}</p>
                    <p className="text-xs text-muted-foreground">
                      R$ {lot.cost_per_unit.toFixed(2)}/un
                    </p>
                  </div>
                </div>
              );
            })}
            <Dialog open={isCreateLotOpen} onOpenChange={setIsCreateLotOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Lote
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Lote</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Material</Label>
                    <Select
                      value={lotForm.material_id}
                      onValueChange={(value) => setLotForm({ ...lotForm, material_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o material" />
                      </SelectTrigger>
                      <SelectContent>
                        {inputMaterials.map(material => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name} ({material.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        value={lotForm.quantity}
                        onChange={(e) => {
                          const quantity = parseFloat(e.target.value) || 0;
                          setLotForm({ 
                            ...lotForm, 
                            quantity,
                            total_cost: quantity * lotForm.cost_per_unit
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label>Custo por Unidade</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={lotForm.cost_per_unit}
                        onChange={(e) => {
                          const cost = parseFloat(e.target.value) || 0;
                          setLotForm({ 
                            ...lotForm, 
                            cost_per_unit: cost,
                            total_cost: lotForm.quantity * cost
                          });
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Código do Lote</Label>
                    <Input
                      value={lotForm.lot_code}
                      onChange={(e) => setLotForm({ ...lotForm, lot_code: e.target.value })}
                      placeholder="Ex: LOT001"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateLotOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateLot} disabled={createMaterialLot.isPending}>
                      {createMaterialLot.isPending ? 'Criando...' : 'Criar Lote'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Packaging Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Regras de Embalagem ({packagingRules.length})
            </CardTitle>
            <CardDescription>Para cálculo de frete</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {packagingRules.map(rule => {
              return (
                <div key={rule.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="font-medium text-sm">{rule.materials?.name || 'Material não encontrado'}</p>
                    <p className="text-xs text-muted-foreground">
                      Máx: {rule.max_items} itens
                      {rule.item_size_ml && ` (${rule.item_size_ml}ml)`}
                    </p>
                  </div>
                  <Badge variant={rule.is_active ? "default" : "secondary"}>
                    {rule.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              );
            })}
            <Dialog open={isCreateRuleOpen} onOpenChange={setIsCreateRuleOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Regra
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Regra de Embalagem</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Caixa/Container</Label>
                    <Select
                      value={ruleForm.container_material_id}
                      onValueChange={(value) => setRuleForm({ ...ruleForm, container_material_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a caixa" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.filter(m => m.category === 'caixa').map(material => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Máx Itens por Caixa</Label>
                      <Input
                        type="number"
                        value={ruleForm.max_items}
                        onChange={(e) => setRuleForm({ ...ruleForm, max_items: parseInt(e.target.value) || 6 })}
                      />
                    </div>
                    <div>
                      <Label>Tamanho ML (opcional)</Label>
                      <Input
                        type="number"
                        value={ruleForm.item_size_ml || ''}
                        onChange={(e) => setRuleForm({ ...ruleForm, item_size_ml: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="Ex: 5"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateRuleOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateRule} disabled={createPackagingRule.isPending}>
                      {createPackagingRule.isPending ? 'Criando...' : 'Criar Regra'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* All Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle>Todos os Materiais</CardTitle>
          <CardDescription>Lista completa de materiais cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Custo/Unidade</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map(material => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{material.category}</Badge>
                  </TableCell>
                  <TableCell>R$ {material.cost_per_unit.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={material.current_stock <= material.min_stock_alert ? 'text-warning font-medium' : ''}>
                      {material.current_stock} {material.unit}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={material.is_active ? "default" : "secondary"}>
                      {material.is_active ? "Ativo" : "Inativo"}
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
}