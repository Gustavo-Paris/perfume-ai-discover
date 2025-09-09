import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Calculator, TrendingUp, Package } from 'lucide-react';
import { usePerfumesWithCosts, type PerfumeWithCosts } from '@/hooks/usePerfumes';
import { useProductRecipes, useCreateProductRecipe, useCalculateProductCost } from '@/hooks/useMaterials';
import { useMaterials } from '@/hooks/useMaterials';
import { toast } from 'sonner';

export default function AdminCostManagement() {
  const [selectedPerfume, setSelectedPerfume] = useState<string>('');
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);
  const [recipeForm, setRecipeForm] = useState({
    perfume_id: '',
    size_ml: 5,
    material_id: '',
    quantity_needed: 0,
  });

  const { data: perfumes = [] } = usePerfumesWithCosts();
  const { data: materials = [] } = useMaterials();
  const { data: recipes = [] } = useProductRecipes(selectedPerfume);
  const createRecipe = useCreateProductRecipe();
  const calculateCost = useCalculateProductCost();

  const [costAnalysis, setCostAnalysis] = useState<any>(null);

  const handleCreateRecipe = async () => {
    try {
      await createRecipe.mutateAsync(recipeForm);
      toast.success('Receita criada com sucesso!');
      setIsRecipeDialogOpen(false);
      setRecipeForm({
        perfume_id: '',
        size_ml: 5,
        material_id: '',
        quantity_needed: 0,
      });
    } catch (error) {
      toast.error('Erro ao criar receita');
    }
  };

  const handleCalculateCost = async (perfumeId: string, sizeML: number) => {
    try {
      const result = await calculateCost.mutateAsync({ perfumeId, sizeML });
      setCostAnalysis(result);
    } catch (error) {
      toast.error('Erro ao calcular custo');
    }
  };

  const inputMaterials = materials.filter(m => m.type === 'input' && m.is_active);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Custos</h1>
          <p className="text-muted-foreground mt-2">
            Controle de custos e margem de lucro dos produtos
          </p>
        </div>
      </div>

      <Tabs defaultValue="recipes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recipes">Receitas de Produtos</TabsTrigger>
          <TabsTrigger value="analysis">Análise de Custos</TabsTrigger>
          <TabsTrigger value="margins">Margens de Lucro</TabsTrigger>
        </TabsList>

        <TabsContent value="recipes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Receitas de Materiais</h2>
            <Dialog open={isRecipeDialogOpen} onOpenChange={setIsRecipeDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Receita
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Receita de Material</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Perfume</Label>
                    <Select
                      value={recipeForm.perfume_id}
                      onValueChange={(value) => setRecipeForm({ ...recipeForm, perfume_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o perfume" />
                      </SelectTrigger>
                      <SelectContent>
                        {perfumes.map(perfume => (
                          <SelectItem key={perfume.id} value={perfume.id}>
                            {perfume.brand} - {perfume.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tamanho (ml)</Label>
                    <Select
                      value={recipeForm.size_ml.toString()}
                      onValueChange={(value) => setRecipeForm({ ...recipeForm, size_ml: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5ml</SelectItem>
                        <SelectItem value="10">10ml</SelectItem>
                        <SelectItem value="50">50ml (Frasco)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Material</Label>
                    <Select
                      value={recipeForm.material_id}
                      onValueChange={(value) => setRecipeForm({ ...recipeForm, material_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o material" />
                      </SelectTrigger>
                      <SelectContent>
                        {inputMaterials.map(material => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name} - R$ {material.cost_per_unit.toFixed(2)}/{material.unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantidade Necessária</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={recipeForm.quantity_needed}
                      onChange={(e) => setRecipeForm({ ...recipeForm, quantity_needed: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsRecipeDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateRecipe} disabled={createRecipe.isPending}>
                    {createRecipe.isPending ? 'Criando...' : 'Criar Receita'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Selecionar Perfume</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedPerfume} onValueChange={setSelectedPerfume}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um perfume" />
                  </SelectTrigger>
                  <SelectContent>
                    {perfumes.map(perfume => (
                      <SelectItem key={perfume.id} value={perfume.id}>
                        <div>
                          <p className="font-medium">{perfume.name}</p>
                          <p className="text-sm text-muted-foreground">{perfume.brand}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Receitas do Produto</CardTitle>
                <CardDescription>Materiais utilizados na produção</CardDescription>
              </CardHeader>
              <CardContent>
                {recipes.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tamanho</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Custo Unit.</TableHead>
                        <TableHead>Custo Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipes.map(recipe => (
                        <TableRow key={recipe.id}>
                          <TableCell>{recipe.size_ml}ml</TableCell>
                          <TableCell>{recipe.materials?.name}</TableCell>
                          <TableCell>{recipe.quantity_needed} {recipe.materials?.unit}</TableCell>
                          <TableCell>R$ {recipe.materials?.cost_per_unit.toFixed(2)}</TableCell>
                          <TableCell>
                            R$ {(recipe.quantity_needed * (recipe.materials?.cost_per_unit || 0)).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {selectedPerfume ? 'Nenhuma receita encontrada para este perfume' : 'Selecione um perfume para ver as receitas'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculadora de Custos
              </CardTitle>
              <CardDescription>Calcule o custo total de produção incluindo materiais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Perfume</Label>
                  <Select onValueChange={(perfumeId) => {
                    const sizes = [5, 10, 50];
                    sizes.forEach(size => handleCalculateCost(perfumeId, size));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfume" />
                    </SelectTrigger>
                    <SelectContent>
                      {perfumes.map(perfume => (
                        <SelectItem key={perfume.id} value={perfume.id}>
                          {perfume.brand} - {perfume.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {costAnalysis && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Custo do Perfume</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        R$ {costAnalysis.perfume_cost_per_unit?.toFixed(4) || '0.0000'}
                      </p>
                      <p className="text-sm text-muted-foreground">Por unidade</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Custo dos Materiais</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        R$ {costAnalysis.materials_cost_per_unit?.toFixed(4) || '0.0000'}
                      </p>
                      <p className="text-sm text-muted-foreground">Por unidade</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Custo Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary">
                        R$ {costAnalysis.total_cost_per_unit?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-sm text-success">
                        Preço sugerido: R$ {costAnalysis.suggested_price?.toFixed(2) || '0.00'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="margins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Análise de Margens
              </CardTitle>
              <CardDescription>Margem de lucro por produto e tamanho</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {perfumes.slice(0, 10).map(perfume => (
                  <div key={perfume.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{perfume.name}</h3>
                        <p className="text-sm text-muted-foreground">{perfume.brand}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Custo médio: R$ {perfume.avg_cost_per_ml?.toFixed(4) || '0.0000'}/ml
                        </p>
                      </div>
                      <Badge variant="outline">
                        Margem alvo: {((perfume.target_margin_percentage || 0.5) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium">5ml</p>
                        <p>Preço: R$ {perfume.price_5ml?.toFixed(2) || '0.00'}</p>
                        <p>Custo: R$ {((perfume.avg_cost_per_ml || 0) * 5).toFixed(2)}</p>
                        {perfume.price_5ml && (
                          <p className={`font-medium ${
                            (perfume.price_5ml - (perfume.avg_cost_per_ml || 0) * 5) / perfume.price_5ml > (perfume.target_margin_percentage || 0.5)
                              ? 'text-success' : 'text-warning'
                          }`}>
                            Margem: {(((perfume.price_5ml - (perfume.avg_cost_per_ml || 0) * 5) / perfume.price_5ml) * 100).toFixed(1)}%
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium">10ml</p>
                        <p>Preço: R$ {perfume.price_10ml?.toFixed(2) || '0.00'}</p>
                        <p>Custo: R$ {((perfume.avg_cost_per_ml || 0) * 10).toFixed(2)}</p>
                        {perfume.price_10ml && (
                          <p className={`font-medium ${
                            (perfume.price_10ml - (perfume.avg_cost_per_ml || 0) * 10) / perfume.price_10ml > (perfume.target_margin_percentage || 0.5)
                              ? 'text-success' : 'text-warning'
                          }`}>
                            Margem: {(((perfume.price_10ml - (perfume.avg_cost_per_ml || 0) * 10) / perfume.price_10ml) * 100).toFixed(1)}%
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium">50ml</p>
                        <p>Preço: R$ {perfume.price_full?.toFixed(2) || '0.00'}</p>
                        <p>Custo: R$ {((perfume.avg_cost_per_ml || 0) * 50).toFixed(2)}</p>
                        <p className={`font-medium ${
                          (perfume.price_full - (perfume.avg_cost_per_ml || 0) * 50) / perfume.price_full > (perfume.target_margin_percentage || 0.5)
                            ? 'text-success' : 'text-warning'
                        }`}>
                          Margem: {(((perfume.price_full - (perfume.avg_cost_per_ml || 0) * 50) / perfume.price_full) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}