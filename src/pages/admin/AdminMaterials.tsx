import { useState } from 'react';
import { Plus, Package, Wrench, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useMaterials, useCreateMaterial, useMaterialLots, useCreateMaterialLot, usePackagingRules, useCreatePackagingRule, type Material, type MaterialLot, type PackagingRule } from '@/hooks/useMaterials';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export default function AdminMaterials() {
  const [activeTab, setActiveTab] = useState('materials');
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
    // Validações básicas
    if (!lotForm.material_id) {
      toast.error('Selecione um material');
      return;
    }
    
    if (lotForm.quantity <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }
    
    if (lotForm.cost_per_unit <= 0) {
      toast.error('Custo por unidade deve ser maior que zero');
      return;
    }

    try {
      const lotData = {
        ...lotForm,
        supplier: lotForm.supplier || null, // Converter string vazia para null
        expiry_date: lotForm.expiry_date || null, // Converter string vazia para null
        lot_code: lotForm.lot_code || null, // Converter string vazia para null
        notes: lotForm.notes || null, // Converter string vazia para null
      };
      
      await createMaterialLot.mutateAsync(lotData);
      
      // Atualizar o estoque atual do material
      const { data: currentMaterial } = await supabase
        .from('materials')
        .select('current_stock')
        .eq('id', lotForm.material_id)
        .single();
      
      if (currentMaterial) {
        const { error: updateError } = await supabase
          .from('materials')
          .update({ 
            current_stock: currentMaterial.current_stock + lotForm.quantity,
            cost_per_unit: lotForm.cost_per_unit // Atualizar também o custo por unidade
          })
          .eq('id', lotForm.material_id);
        
        if (updateError) {
          console.error('Erro ao atualizar estoque do material:', updateError);
        }
      }
      
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
      console.error('Erro ao criar lote de material:', error);
      toast.error('Erro ao criar lote de material: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
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
  const assetMaterials = materials.filter(m => m.type === 'asset');
  const lowStockMaterials = materials.filter(m => m.current_stock <= m.min_stock_alert);

  if (materialsLoading || lotsLoading || rulesLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Materiais</h1>
          <p className="text-muted-foreground mt-2">
            Controle de insumos, ativos e regras de embalagem
          </p>
        </div>
      </div>

      {/* Alert for Low Stock */}
      {lowStockMaterials.length > 0 && (
        <Card className="border-warning bg-warning/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Materiais com Estoque Baixo
            </CardTitle>
            <CardDescription>
              {lowStockMaterials.length} materiais precisam de reposição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockMaterials.map(material => (
                <div key={material.id} className="flex justify-between items-center text-sm">
                  <span>{material.name}</span>
                  <Badge variant="outline" className="text-warning">
                    {material.current_stock} {material.unit} (mín: {material.min_stock_alert})
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="materials">Materiais ({materials.length})</TabsTrigger>
          <TabsTrigger value="lots">Lotes ({materialLots.length})</TabsTrigger>
          <TabsTrigger value="packaging">Embalagem ({packagingRules.length})</TabsTrigger>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Materiais e Insumos</h2>
            <Dialog open={isCreateMaterialOpen} onOpenChange={setIsCreateMaterialOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Material
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Material</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={materialForm.name}
                      onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                      placeholder="Ex: Caixa Padrão"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={materialForm.type}
                      onValueChange={(value: 'input' | 'asset') => 
                        setMaterialForm({ ...materialForm, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="input">Insumo (Consumível)</SelectItem>
                        <SelectItem value="asset">Ativo (Equipamento)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={materialForm.category}
                      onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })}
                      placeholder="Ex: packaging, tools"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unidade</Label>
                    <Input
                      id="unit"
                      value={materialForm.unit}
                      onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })}
                      placeholder="Ex: pieces, ml, kg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Custo por Unidade (R$)</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={materialForm.cost_per_unit}
                      onChange={(e) => setMaterialForm({ ...materialForm, cost_per_unit: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Estoque Atual</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={materialForm.current_stock}
                      onChange={(e) => setMaterialForm({ ...materialForm, current_stock: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min_stock">Estoque Mínimo</Label>
                    <Input
                      id="min_stock"
                      type="number"
                      value={materialForm.min_stock_alert}
                      onChange={(e) => setMaterialForm({ ...materialForm, min_stock_alert: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Fornecedor</Label>
                    <Input
                      id="supplier"
                      value={materialForm.supplier}
                      onChange={(e) => setMaterialForm({ ...materialForm, supplier: e.target.value })}
                      placeholder="Nome do fornecedor"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={materialForm.description}
                      onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                      placeholder="Descrição detalhada do material"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={materialForm.is_active}
                      onCheckedChange={(checked) => setMaterialForm({ ...materialForm, is_active: checked })}
                    />
                    <Label htmlFor="active">Material Ativo</Label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateMaterialOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateMaterial} disabled={createMaterial.isPending}>
                    {createMaterial.isPending ? 'Criando...' : 'Criar Material'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Insumos ({inputMaterials.length})
                </CardTitle>
                <CardDescription>Materiais consumíveis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {inputMaterials.map(material => (
                    <div key={material.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{material.name}</p>
                        <p className="text-sm text-muted-foreground">{material.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R$ {material.cost_per_unit.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          {material.current_stock} {material.unit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Ativos ({assetMaterials.length})
                </CardTitle>
                <CardDescription>Equipamentos e ferramentas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {assetMaterials.map(material => (
                    <div key={material.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{material.name}</p>
                        <p className="text-sm text-muted-foreground">{material.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R$ {material.cost_per_unit.toFixed(2)}</p>
                        <Badge variant="outline">Ativo</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lots" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Lotes de Materiais</h2>
            <Dialog open={isCreateLotOpen} onOpenChange={setIsCreateLotOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Lote
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Lote</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="material">Material</Label>
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
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantidade</Label>
                      <Input
                        id="quantity"
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
                    <div className="space-y-2">
                      <Label htmlFor="cost_per_unit">Custo por Unidade</Label>
                      <Input
                        id="cost_per_unit"
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

                  <div className="space-y-2">
                    <Label>Custo Total: R$ {lotForm.total_cost.toFixed(2)}</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lot_supplier">Fornecedor</Label>
                    <Input
                      id="lot_supplier"
                      value={lotForm.supplier}
                      onChange={(e) => setLotForm({ ...lotForm, supplier: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lot_code">Código do Lote</Label>
                    <Input
                      id="lot_code"
                      value={lotForm.lot_code}
                      onChange={(e) => setLotForm({ ...lotForm, lot_code: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateLotOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateLot} disabled={createMaterialLot.isPending}>
                    {createMaterialLot.isPending ? 'Criando...' : 'Criar Lote'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Custo/Un.</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialLots.map(lot => (
                    <TableRow key={lot.id}>
                      <TableCell>{lot.materials?.name || 'N/A'}</TableCell>
                      <TableCell>{lot.quantity} {lot.materials?.unit}</TableCell>
                      <TableCell>R$ {lot.cost_per_unit.toFixed(2)}</TableCell>
                      <TableCell>R$ {lot.total_cost.toFixed(2)}</TableCell>
                      <TableCell>{lot.supplier || '-'}</TableCell>
                      <TableCell>{format(new Date(lot.purchase_date), 'dd/MM/yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packaging" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Regras de Embalagem</h2>
            <Dialog open={isCreateRuleOpen} onOpenChange={setIsCreateRuleOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Regra
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Regra de Embalagem</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="container">Container</Label>
                    <Select
                      value={ruleForm.container_material_id}
                      onValueChange={(value) => setRuleForm({ ...ruleForm, container_material_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o container" />
                      </SelectTrigger>
                      <SelectContent>
                        {inputMaterials
                          .filter(m => m.category === 'packaging')
                          .map(material => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max_items">Máximo de Itens</Label>
                      <Input
                        id="max_items"
                        type="number"
                        value={ruleForm.max_items}
                        onChange={(e) => setRuleForm({ ...ruleForm, max_items: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Prioridade</Label>
                      <Input
                        id="priority"
                        type="number"
                        value={ruleForm.priority}
                        onChange={(e) => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateRuleOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateRule} disabled={createPackagingRule.isPending}>
                    {createPackagingRule.isPending ? 'Criando...' : 'Criar Regra'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Container</TableHead>
                    <TableHead>Max. Itens</TableHead>
                    <TableHead>Custo/Un.</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packagingRules.map(rule => (
                    <TableRow key={rule.id}>
                      <TableCell>{rule.materials?.name || 'N/A'}</TableCell>
                      <TableCell>{rule.max_items}</TableCell>
                      <TableCell>R$ {rule.materials?.cost_per_unit.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>{rule.priority}</TableCell>
                      <TableCell>
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total de Materiais</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{materials.length}</p>
                <p className="text-sm text-muted-foreground">
                  {inputMaterials.length} insumos • {assetMaterials.length} ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Valor em Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  R$ {inputMaterials
                    .reduce((sum, m) => sum + (m.current_stock * m.cost_per_unit), 0)
                    .toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Apenas insumos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-warning">
                  {lowStockMaterials.length}
                </p>
                <p className="text-sm text-muted-foreground">Estoque baixo</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}