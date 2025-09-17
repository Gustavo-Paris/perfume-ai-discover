import { useState } from 'react';
import { Plus, Package, AlertTriangle, Boxes, Tags, Edit2, Trash2, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useMaterials, 
  useCreateMaterial, 
  useUpdateMaterial,
  useDeleteMaterial,
  useMaterialLots, 
  useCreateMaterialLot,
  useUpdateMaterialLot,
  useDeleteMaterialLot,
  usePackagingRules, 
  useCreatePackagingRule,
  useUpdatePackagingRule,
  useDeletePackagingRule,
  Material,
  MaterialLot,
  PackagingRule
} from '@/hooks/useMaterials';
import MaterialSetupAssistant from '@/components/admin/MaterialSetupAssistant';
import MaterialDetectionCard from '@/components/admin/MaterialDetectionCard';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminMaterialsSimplified() {
  const [isCreateMaterialOpen, setIsCreateMaterialOpen] = useState(false);
  const [isCreateLotOpen, setIsCreateLotOpen] = useState(false);
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  
  // Estados para edição
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editingLot, setEditingLot] = useState<MaterialLot | null>(null);
  const [editingRule, setEditingRule] = useState<PackagingRule | null>(null);

  const { data: materials = [], isLoading: materialsLoading } = useMaterials();
  const { data: materialLots = [], isLoading: lotsLoading } = useMaterialLots();
  const { data: packagingRules = [], isLoading: rulesLoading } = usePackagingRules();

  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();
  const createMaterialLot = useCreateMaterialLot();
  const updateMaterialLot = useUpdateMaterialLot();
  const deleteMaterialLot = useDeleteMaterialLot();
  const createPackagingRule = useCreatePackagingRule();
  const updatePackagingRule = useUpdatePackagingRule();
  const deletePackagingRule = useDeletePackagingRule();

  const [materialForm, setMaterialForm] = useState({
    name: '',
    type: 'input' as 'input' | 'asset',
    category: '',
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
      const materialData = {
        ...materialForm,
        unit: 'unidade',
        cost_per_unit: 0,
        current_stock: 0,
        min_stock_alert: 0,
      };
      
      if (editingMaterial) {
        await updateMaterial.mutateAsync({ 
          id: editingMaterial.id, 
          updates: materialData 
        });
        toast.success('Material atualizado com sucesso!');
        setEditingMaterial(null);
      } else {
        await createMaterial.mutateAsync(materialData);
        toast.success('Material criado com sucesso!');
      }
      
      setIsCreateMaterialOpen(false);
      setMaterialForm({
        name: '',
        type: 'input',
        category: '',
        supplier: '',
        description: '',
        is_active: true,
      });
    } catch (error) {
      toast.error(editingMaterial ? 'Erro ao atualizar material' : 'Erro ao criar material');
    }
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setMaterialForm({
      name: material.name,
      type: material.type,
      category: material.category,
      supplier: material.supplier || '',
      description: material.description || '',
      is_active: material.is_active,
    });
    setIsCreateMaterialOpen(true);
  };

  const handleDeleteMaterial = async (material: Material) => {
    try {
      await deleteMaterial.mutateAsync(material.id);
      toast.success('Material excluído com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir material');
    }
  };

  const handleCreateLot = async () => {
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
        supplier: lotForm.supplier || null,
        expiry_date: lotForm.expiry_date || null,
        lot_code: lotForm.lot_code || null,
        notes: lotForm.notes || null,
      };
      
      if (editingLot) {
        await updateMaterialLot.mutateAsync({ 
          id: editingLot.id, 
          updates: lotData 
        });
        toast.success('Lote atualizado com sucesso!');
        setEditingLot(null);
      } else {
        await createMaterialLot.mutateAsync(lotData);
        toast.success('Lote criado com sucesso!');
      }
      
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
      console.error('Erro ao processar lote:', error);
      toast.error(editingLot ? 'Erro ao atualizar lote' : 'Erro ao criar lote');
    }
  };

  const handleEditLot = (lot: MaterialLot) => {
    setEditingLot(lot);
    setLotForm({
      material_id: lot.material_id,
      quantity: lot.quantity,
      cost_per_unit: lot.cost_per_unit,
      total_cost: lot.total_cost,
      supplier: lot.supplier || '',
      purchase_date: lot.purchase_date.split('T')[0],
      expiry_date: lot.expiry_date || '',
      lot_code: lot.lot_code || '',
      notes: lot.notes || '',
    });
    setIsCreateLotOpen(true);
  };

  const handleDeleteLot = async (lot: MaterialLot) => {
    try {
      await deleteMaterialLot.mutateAsync(lot.id);
      toast.success('Lote excluído com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir lote');
    }
  };

  const handleCreateRule = async () => {
    try {
      if (editingRule) {
        await updatePackagingRule.mutateAsync({ 
          id: editingRule.id, 
          updates: ruleForm 
        });
        toast.success('Regra atualizada com sucesso!');
        setEditingRule(null);
      } else {
        await createPackagingRule.mutateAsync(ruleForm);
        toast.success('Regra criada com sucesso!');
      }
      
      setIsCreateRuleOpen(false);
      setRuleForm({
        container_material_id: '',
        max_items: 6,
        item_size_ml: null,
        priority: 1,
        is_active: true,
      });
    } catch (error) {
      toast.error(editingRule ? 'Erro ao atualizar regra' : 'Erro ao criar regra');
    }
  };

  const handleEditRule = (rule: PackagingRule) => {
    setEditingRule(rule);
    setRuleForm({
      container_material_id: rule.container_material_id,
      max_items: rule.max_items,
      item_size_ml: rule.item_size_ml,
      priority: rule.priority,
      is_active: rule.is_active,
    });
    setIsCreateRuleOpen(true);
  };

  const handleDeleteRule = async (rule: PackagingRule) => {
    try {
      await deletePackagingRule.mutateAsync(rule.id);
      toast.success('Regra excluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir regra');
    }
  };

  const packagingMaterials = materials.filter(m => ['frasco', 'etiqueta', 'caixa'].includes(m.category));
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

      {/* Cards de Automação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Setup Inicial dos Materiais
            </CardTitle>
            <CardDescription>
              Configure quais materiais serão usados como frascos e etiquetas padrão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MaterialSetupAssistant />
          </CardContent>
        </Card>
        
        <MaterialDetectionCard />
      </div>

      {/* Tab-based Interface */}
      <Tabs defaultValue="materials" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="materials">Materiais</TabsTrigger>
          <TabsTrigger value="lots">Lotes</TabsTrigger>
          <TabsTrigger value="rules">Regras de Embalagem</TabsTrigger>
        </TabsList>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Boxes className="h-5 w-5" />
                  Todos os Materiais ({materials.length})
                </CardTitle>
                <CardDescription>
                  Gestão completa dos materiais do sistema
                </CardDescription>
              </div>
              <Dialog open={isCreateMaterialOpen} onOpenChange={setIsCreateMaterialOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Material
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingMaterial ? 'Editar Material' : 'Novo Material'}</DialogTitle>
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
                    <div>
                      <Label>Fornecedor (opcional)</Label>
                      <Input
                        value={materialForm.supplier}
                        onChange={(e) => setMaterialForm({ ...materialForm, supplier: e.target.value })}
                        placeholder="Nome do fornecedor"
                      />
                    </div>
                    <div>
                      <Label>Descrição (opcional)</Label>
                      <Textarea
                        value={materialForm.description}
                        onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                        placeholder="Detalhes do material"
                      />
                    </div>
                    <div>
                      <Label>Nota</Label>
                      <p className="text-sm text-muted-foreground">
                        Unidade e custos serão definidos pelos lotes
                      </p>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => {
                        setIsCreateMaterialOpen(false);
                        setEditingMaterial(null);
                        setMaterialForm({
                          name: '',
                          type: 'input',
                          category: '',
                          supplier: '',
                          description: '',
                          is_active: true,
                        });
                      }}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleCreateMaterial} 
                        disabled={createMaterial.isPending || updateMaterial.isPending}
                      >
                        {createMaterial.isPending || updateMaterial.isPending ? 'Salvando...' : (editingMaterial ? 'Atualizar' : 'Criar')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Custo/Unidade</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map(material => (
                    <TableRow key={material.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{material.name}</p>
                          <p className="text-sm text-muted-foreground">{material.supplier || 'Sem fornecedor'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{material.category}</Badge>
                      </TableCell>
                      <TableCell>R$ {material.cost_per_unit.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{material.current_stock} {material.unit}</span>
                          {material.current_stock <= material.min_stock_alert && (
                            <Badge variant="destructive">Baixo</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={material.is_active ? "default" : "secondary"}>
                          {material.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMaterial(material)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Material</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir "{material.name}"? Esta ação não pode ser desfeita.
                                  O sistema verificará se o material pode ser excluído com segurança.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteMaterial(material)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lots Tab */}
        <TabsContent value="lots" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Lotes de Materiais ({materialLots.length})
                </CardTitle>
                <CardDescription>
                  Controle de compras e estoque por lotes
                </CardDescription>
              </div>
              <Dialog open={isCreateLotOpen} onOpenChange={setIsCreateLotOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Lote
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingLot ? 'Editar Lote' : 'Novo Lote'}</DialogTitle>
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
                          {materials.map(material => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.name}
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
                          onChange={(e) => setLotForm({ ...lotForm, quantity: Number(e.target.value) })}
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <Label>Custo/Unidade</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={lotForm.cost_per_unit}
                          onChange={(e) => setLotForm({ ...lotForm, cost_per_unit: Number(e.target.value), total_cost: Number(e.target.value) * lotForm.quantity })}
                          placeholder="1.50"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Código do Lote (opcional)</Label>
                      <Input
                        value={lotForm.lot_code}
                        onChange={(e) => setLotForm({ ...lotForm, lot_code: e.target.value })}
                        placeholder="LOTE001"
                      />
                    </div>
                    <div>
                      <Label>Fornecedor (opcional)</Label>
                      <Input
                        value={lotForm.supplier}
                        onChange={(e) => setLotForm({ ...lotForm, supplier: e.target.value })}
                        placeholder="Nome do fornecedor"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Data da Compra</Label>
                        <Input
                          type="date"
                          value={lotForm.purchase_date}
                          onChange={(e) => setLotForm({ ...lotForm, purchase_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Data de Validade (opcional)</Label>
                        <Input
                          type="date"
                          value={lotForm.expiry_date}
                          onChange={(e) => setLotForm({ ...lotForm, expiry_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Observações (opcional)</Label>
                      <Textarea
                        value={lotForm.notes}
                        onChange={(e) => setLotForm({ ...lotForm, notes: e.target.value })}
                        placeholder="Informações adicionais"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <strong>Custo Total: R$ {(lotForm.quantity * lotForm.cost_per_unit).toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => {
                        setIsCreateLotOpen(false);
                        setEditingLot(null);
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
                      }}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleCreateLot} 
                        disabled={createMaterialLot.isPending || updateMaterialLot.isPending}
                      >
                        {createMaterialLot.isPending || updateMaterialLot.isPending ? 'Salvando...' : (editingLot ? 'Atualizar' : 'Criar')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Custo/Unidade</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Compra</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialLots.map(lot => (
                    <TableRow key={lot.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lot.materials?.name || 'Material não encontrado'}</p>
                          <p className="text-sm text-muted-foreground">{lot.supplier || 'Sem fornecedor'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{lot.lot_code || `#${lot.id.slice(-6)}`}</Badge>
                      </TableCell>
                      <TableCell>{lot.quantity}</TableCell>
                      <TableCell>R$ {lot.cost_per_unit.toFixed(2)}</TableCell>
                      <TableCell>R$ {lot.total_cost.toFixed(2)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{format(new Date(lot.purchase_date), 'dd/MM/yyyy')}</p>
                          {lot.expiry_date && (
                            <p className="text-xs text-muted-foreground">
                              Validade: {format(new Date(lot.expiry_date), 'dd/MM/yyyy')}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditLot(lot)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Lote</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este lote? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteLot(lot)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Packaging Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Tags className="h-5 w-5" />
                  Regras de Embalagem ({packagingRules.length})
                </CardTitle>
                <CardDescription>
                  Configuração de como embalar os pedidos
                </CardDescription>
              </div>
              <Dialog open={isCreateRuleOpen} onOpenChange={setIsCreateRuleOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Regra
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingRule ? 'Editar Regra' : 'Nova Regra de Embalagem'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Tipo de Container</Label>
                      <Select
                        value={ruleForm.container_material_id}
                        onValueChange={(value) => setRuleForm({ ...ruleForm, container_material_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o container" />
                        </SelectTrigger>
                        <SelectContent>
                          {packagingMaterials.map(material => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Máximo de Itens</Label>
                        <Input
                          type="number"
                          value={ruleForm.max_items}
                          onChange={(e) => setRuleForm({ ...ruleForm, max_items: Number(e.target.value) })}
                          placeholder="6"
                        />
                      </div>
                      <div>
                        <Label>Prioridade</Label>
                        <Input
                          type="number"
                          value={ruleForm.priority}
                          onChange={(e) => setRuleForm({ ...ruleForm, priority: Number(e.target.value) })}
                          placeholder="1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Tamanho do Item (ml) - opcional</Label>
                      <Input
                        type="number"
                        value={ruleForm.item_size_ml || ''}
                        onChange={(e) => setRuleForm({ ...ruleForm, item_size_ml: e.target.value ? Number(e.target.value) : null })}
                        placeholder="Para tamanhos específicos (ex: 5)"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={ruleForm.is_active}
                        onCheckedChange={(checked) => setRuleForm({ ...ruleForm, is_active: checked })}
                      />
                      <Label>Regra ativa</Label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => {
                        setIsCreateRuleOpen(false);
                        setEditingRule(null);
                        setRuleForm({
                          container_material_id: '',
                          max_items: 6,
                          item_size_ml: null,
                          priority: 1,
                          is_active: true,
                        });
                      }}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleCreateRule} 
                        disabled={createPackagingRule.isPending || updatePackagingRule.isPending}
                      >
                        {createPackagingRule.isPending || updatePackagingRule.isPending ? 'Salvando...' : (editingRule ? 'Atualizar' : 'Criar')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Container</TableHead>
                    <TableHead>Max. Itens</TableHead>
                    <TableHead>Tamanho Item</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packagingRules.map(rule => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rule.materials?.name || 'Container não encontrado'}</p>
                          <p className="text-sm text-muted-foreground">R$ {rule.materials?.cost_per_unit?.toFixed(2) || '0.00'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{rule.max_items}</TableCell>
                      <TableCell>
                        {rule.item_size_ml ? `${rule.item_size_ml}ml` : 'Qualquer'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRule(rule)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Regra</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir esta regra de embalagem? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteRule(rule)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}