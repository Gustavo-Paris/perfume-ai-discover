import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { NavigationBreadcrumbs } from '@/components/admin/NavigationBreadcrumbs';
import { SmartValidations, DependencyStatus } from '@/components/admin/SmartValidations';
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  Edit,
  Eye,
  Calculator,
  Bot
} from 'lucide-react';
import { useCreatePerfume, usePerfumesWithCosts } from '@/hooks/usePerfumes';
import { useCreateInventoryLot, useInventoryLots } from '@/hooks/useInventoryLots';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useToast } from '@/hooks/use-toast';
import { useMaterialConfigurations } from '@/hooks/useMaterialConfigurations';
import { supabase } from '@/integrations/supabase/client';

interface PerfumeFormData {
  brand: string;
  name: string;
  description: string;
  family: string;
  gender: 'masculino' | 'feminino' | 'unissex';
  category: string;
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];
  image_url: string;
}

interface LotFormData {
  lot_code: string;
  qty_ml: number;
  total_cost: number;
  warehouse_id: string;
  supplier: string;
  expiry_date: string;
}

interface CalculatedPrices {
  [key: string]: any;
  sizes?: number[];
  prices?: Array<{
    sizeMl: number;
    perfumeCost: number;
    packagingCost: number;
    totalCost: number;
    suggestedPrice: number;
  }>;
  perfume_cost: number;
  materials_cost: number;
  packaging_cost: number;
  total_cost_per_unit: number;
}

const AdminProductCadastro = () => {
  const [perfumeData, setPerfumeData] = useState<PerfumeFormData>({
    brand: '',
    name: '',
    description: '',
    family: '',
    gender: 'unissex',
    category: '',
    top_notes: [],
    heart_notes: [],
    base_notes: [],
    image_url: ''
  });

  const [lotData, setLotData] = useState<LotFormData>({
    lot_code: '',
    qty_ml: 0,
    total_cost: 0,
    warehouse_id: '',
    supplier: '',
    expiry_date: ''
  });

  const [marginPercentage, setMarginPercentage] = useState(50);
  const [currentPerfumeId, setCurrentPerfumeId] = useState<string>('');
  const [step, setStep] = useState<'perfume' | 'lot' | 'prices' | 'complete'>('perfume');
  const [loading, setLoading] = useState(false);
  const [calculatedPrices, setCalculatedPrices] = useState<CalculatedPrices | null>(null);

  const { toast } = useToast();
  
  const { data: warehouses = [] } = useWarehouses();
  const { data: existingLots = [] } = useInventoryLots();
  const { data: materialConfig } = useMaterialConfigurations();
  const { data: perfumesWithCosts } = usePerfumesWithCosts();
  
  const createPerfume = useCreatePerfume();
  const createLot = useCreateInventoryLot();

  const parseNotes = (notesString: string): string[] => {
    return notesString.split(',').map(note => note.trim()).filter(note => note.length > 0);
  };

  const formatNotes = (notes: string[]) => notes.join(', ');

  // Calcular custo por ml automaticamente
  const costPerMl = lotData.qty_ml > 0 ? lotData.total_cost / lotData.qty_ml : 0;

  // Função para calcular preços usando a nova função dinâmica
  const calculatePricesWithMaterials = async () => {
    if (!currentPerfumeId || costPerMl === 0) return null;

    try {
      // Usar tamanhos das configurações ou padrão se não houver
      const sizes = materialConfig?.bottle_materials?.map(bm => bm.size_ml) || [2, 5, 10];
      
      // Usar nova função RPC para calcular preços dinamicamente
      const { data: calculatedPrices, error } = await supabase.rpc('calculate_dynamic_product_costs', {
        perfume_uuid: currentPerfumeId,
        sizes_array: sizes
      });

      if (error) {
        console.error('Error calculating prices:', error);
        return null;
      }

      if (!calculatedPrices || calculatedPrices.length === 0) return null;

      // Converter resultado para formato compatível
      const prices = calculatedPrices.map((calc: any) => ({
        sizeMl: calc.size_ml,
        perfumeCost: calc.perfume_cost_per_unit,
        packagingCost: calc.materials_cost_per_unit,
        totalCost: calc.total_cost_per_unit,
        suggestedPrice: calc.suggested_price
      }));

      // Criar estrutura dinâmica de preços
      const pricesObj = {} as any;
      prices.forEach((price) => {
        pricesObj[`price_${price.sizeMl}ml`] = price.suggestedPrice;
      });

      return {
        ...pricesObj,
        sizes: sizes,
        prices: prices,
        perfume_cost: prices[0]?.perfumeCost || 0,
        materials_cost: 0,
        packaging_cost: prices[0]?.packagingCost || 0,
        total_cost_per_unit: prices[0]?.totalCost || 0,
      };
    } catch (error) {
      console.error('Erro ao calcular preços:', error);
      toast({
        title: "Erro",
        description: "Erro ao calcular preços",
        variant: "destructive"
      });
      return null;
    }
  };

  const calculateAverageCostImpact = () => {
    if (!perfumesWithCosts || perfumesWithCosts.length === 0) return null;
    
    const avgCost = perfumesWithCosts.reduce((sum, p) => sum + (p.avg_cost_per_ml || 0), 0) / perfumesWithCosts.length;
    const currentCost = costPerMl;
    
    return {
      avgCost,
      currentCost,
      impact: currentCost > avgCost ? 'acima' : currentCost < avgCost ? 'abaixo' : 'media',
      difference: Math.abs(currentCost - avgCost)
    };
  };

  const validateStep = (stepName: string): boolean => {
    switch (stepName) {
      case 'perfume':
        return !!(perfumeData.brand && perfumeData.name && perfumeData.family && perfumeData.gender);
      case 'lot':
        return !!(lotData.lot_code && lotData.qty_ml > 0 && lotData.total_cost > 0 && lotData.warehouse_id);
      default:
        return false;
    }
  };

  useEffect(() => {
    const fetchPrices = async () => {
      if (step === 'prices' && currentPerfumeId) {
        const prices = await calculatePricesWithMaterials();
        setCalculatedPrices(prices);
      }
    };
    
    fetchPrices();
  }, [step, currentPerfumeId, costPerMl, marginPercentage]);

  const handleCreatePerfume = async () => {
    if (!validateStep('perfume')) {
      toast({
        title: "Dados incompletos", 
        description: "Preencha todos os campos obrigatórios do perfume.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const perfume = await createPerfume.mutateAsync({
        ...perfumeData,
        avg_cost_per_ml: 0,
        target_margin_percentage: marginPercentage / 100,
      } as any);

      setCurrentPerfumeId(perfume.id);
      setStep('lot');
      toast({
        title: "Perfume criado!",
        description: "Agora adicione o primeiro lote de estoque."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar perfume. Verifique os dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLot = async () => {
    if (!validateStep('lot')) {
      toast({
        title: "Dados incompletos", 
        description: "Preencha todos os campos obrigatórios do lote.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await createLot.mutateAsync({
        perfume_id: currentPerfumeId,
        lot_code: lotData.lot_code,
        qty_ml: lotData.qty_ml,
        cost_per_ml: costPerMl,
        total_cost: lotData.total_cost,
        warehouse_id: lotData.warehouse_id,
        supplier: lotData.supplier || null,
        expiry_date: lotData.expiry_date || null
      });

      setStep('prices');
      toast({
        title: "Lote criado!",
        description: "Agora visualize e aplique os preços calculados."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar lote de estoque.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPrices = async () => {
    if (!calculatedPrices || !currentPerfumeId) {
      toast({
        title: "Erro",
        description: "Preços não calculados corretamente.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Salvar preços dinamicamente na nova tabela
      if (calculatedPrices.prices && calculatedPrices.prices.length > 0) {
        const priceInserts = calculatedPrices.prices.map((price: any) => ({
          perfume_id: currentPerfumeId,
          size_ml: price.sizeMl,
          price: price.suggestedPrice
        }));

        const { error: pricesError } = await supabase
          .from('perfume_prices')
          .insert(priceInserts);

        if (pricesError) throw pricesError;
      }
      
      setStep('complete');
      toast({
        title: "Sucesso!",
        description: "Produto criado com estoque e preços calculados!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao aplicar preços.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPerfumeData({
      brand: '', name: '', description: '', family: '', gender: 'unissex',
      category: '', top_notes: [], heart_notes: [], base_notes: [], image_url: ''
    });
    setLotData({
      lot_code: '', qty_ml: 0, total_cost: 0, warehouse_id: '', supplier: '', expiry_date: ''
    });
    setMarginPercentage(50);
    setCurrentPerfumeId('');
    setCalculatedPrices(null);
    setStep('perfume');
  };

  const costImpact = calculateAverageCostImpact();

  return (
    <div className="space-y-6">
      <NavigationBreadcrumbs 
        items={[
          { label: 'Produtos' },
          { label: 'Cadastrar Produto', current: true }
        ]}
        actions={
          <Button 
            onClick={resetForm}
            variant="outline" 
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Dados do Perfume */}
        <Card className={step === 'perfume' ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Dados do Perfume
              {step !== 'perfume' && currentPerfumeId && (
                <Badge variant="default" className="ml-auto">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Criado
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Marca *</Label>
                <Input
                  id="brand"
                  value={perfumeData.brand}
                  onChange={(e) => setPerfumeData({...perfumeData, brand: e.target.value})}
                  placeholder="Ex: Chanel"
                />
              </div>
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={perfumeData.name}
                  onChange={(e) => setPerfumeData({...perfumeData, name: e.target.value})}
                  placeholder="Ex: Bleu de Chanel"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={perfumeData.description}
                onChange={(e) => setPerfumeData({...perfumeData, description: e.target.value})}
                placeholder="Descrição do perfume..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="family">Família Olfativa *</Label>
                <Input
                  id="family"
                  value={perfumeData.family}
                  onChange={(e) => setPerfumeData({...perfumeData, family: e.target.value})}
                  placeholder="Ex: Amadeirada Aromática"
                />
              </div>
              <div>
                <Label htmlFor="gender">Gênero *</Label>
                <Select 
                  value={perfumeData.gender} 
                  onValueChange={(value: any) => setPerfumeData({...perfumeData, gender: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="unissex">Unissex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Notas de Topo</Label>
              <Input
                value={formatNotes(perfumeData.top_notes)}
                onChange={(e) => setPerfumeData({...perfumeData, top_notes: parseNotes(e.target.value)})}
                placeholder="Ex: Bergamota, Limão"
              />
            </div>

            <div>
              <Label>Notas de Coração</Label>
              <Input
                value={formatNotes(perfumeData.heart_notes)}
                onChange={(e) => setPerfumeData({...perfumeData, heart_notes: parseNotes(e.target.value)})}
                placeholder="Ex: Gengibre, Noz-moscada"
              />
            </div>

            <div>
              <Label>Notas de Base</Label>
              <Input
                value={formatNotes(perfumeData.base_notes)}
                onChange={(e) => setPerfumeData({...perfumeData, base_notes: parseNotes(e.target.value)})}
                placeholder="Ex: Sândalo, Cedro"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={perfumeData.category}
                  onChange={(e) => setPerfumeData({...perfumeData, category: e.target.value})}
                  placeholder="Ex: Premium"
                />
              </div>
              <div>
                <Label htmlFor="image_url">URL da Imagem</Label>
                <Input
                  id="image_url"
                  value={perfumeData.image_url}
                  onChange={(e) => setPerfumeData({...perfumeData, image_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>
            </div>

            {step === 'perfume' && (
              <Button 
                onClick={handleCreatePerfume}
                disabled={!validateStep('perfume') || loading}
                className="w-full"
              >
                {loading ? 'Criando...' : 'Criar Perfume'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Lote de Estoque */}
        <Card className={step === 'lot' ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Lote de Estoque
              {(step === 'prices' || step === 'complete') && (
                <Badge variant="default" className="ml-auto">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Adicionado
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lot_code">Código do Lote *</Label>
                <Input
                  id="lot_code"
                  value={lotData.lot_code}
                  onChange={(e) => setLotData({...lotData, lot_code: e.target.value})}
                  placeholder="Ex: BDC001"
                />
              </div>
              <div>
                <Label htmlFor="qty_ml">Quantidade (ml) *</Label>
                <Input
                  id="qty_ml"
                  type="number"
                  value={lotData.qty_ml || ''}
                  onChange={(e) => setLotData({...lotData, qty_ml: parseInt(e.target.value) || 0})}
                  placeholder="Ex: 1000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="total_cost">Custo Total (R$) *</Label>
                <Input
                  id="total_cost"
                  type="number"
                  step="0.01"
                  value={lotData.total_cost || ''}
                  onChange={(e) => setLotData({...lotData, total_cost: parseFloat(e.target.value) || 0})}
                  placeholder="Ex: 500.00"
                />
              </div>
              <div>
                <Label htmlFor="warehouse">Depósito *</Label>
                <Select 
                  value={lotData.warehouse_id} 
                  onValueChange={(value) => setLotData({...lotData, warehouse_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o depósito" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier">Fornecedor</Label>
                <Input
                  id="supplier"
                  value={lotData.supplier}
                  onChange={(e) => setLotData({...lotData, supplier: e.target.value})}
                  placeholder="Nome do fornecedor"
                />
              </div>
              <div>
                <Label htmlFor="expiry_date">Data de Validade</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={lotData.expiry_date}
                  onChange={(e) => setLotData({...lotData, expiry_date: e.target.value})}
                />
              </div>
            </div>

            {/* Análise de Custo */}
            {costPerMl > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Análise de Custo</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Custo por ml:</span>
                    <span className="font-mono">R$ {costPerMl.toFixed(3)}</span>
                  </div>
                  {costImpact && (
                    <div className="flex justify-between">
                      <span>Vs. média do portfólio:</span>
                      <span className={`font-medium ${
                        costImpact.impact === 'acima' ? 'text-orange-600' : 
                        costImpact.impact === 'abaixo' ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {costImpact.impact === 'acima' ? '↑' : costImpact.impact === 'abaixo' ? '↓' : '='} 
                        {costImpact.impact}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {costImpact && costImpact.impact === 'acima' && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <p className="font-medium">Custo acima da média</p>
                    <p>
                      Este lote tem custo R$ {costImpact.difference.toFixed(3)}/ml acima da média. 
                      Considere revisar o fornecedor ou ajustar a margem.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 'lot' && (
              <Button 
                onClick={handleCreateLot}
                disabled={!validateStep('lot') || loading}
                className="w-full"
              >
                {loading ? 'Adicionando...' : 'Adicionar Lote'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Preços Calculados */}
        <Card className={step === 'prices' ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Preços Calculados
              {step === 'complete' && (
                <Badge variant="default" className="ml-auto">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Finalizado
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {calculatedPrices ? (
              <>
                <div className="space-y-3">
                  {calculatedPrices.sizes?.map((size: number, index: number) => (
                    <div key={size} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{size}ml (decant):</span>
                      <span className="font-mono text-lg">
                        R$ {calculatedPrices.prices?.[index]?.suggestedPrice?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="bg-green-50 p-3 rounded-lg text-sm space-y-2">
                  <p className="font-medium text-green-800">
                    Composição do Preço ({calculatedPrices.sizes?.[0] || 5}ml):
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Perfume:</span>
                      <span>R$ {calculatedPrices.perfume_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frasco + Etiqueta:</span>
                      <span>R$ {calculatedPrices.packaging_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Materiais:</span>
                      <span>R$ {calculatedPrices.materials_cost.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Custo Total:</span>
                      <span>R$ {calculatedPrices.total_cost_per_unit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-green-700">
                      <span>Margem ({marginPercentage}%):</span>
                      <span>R$ {((calculatedPrices.prices?.[0]?.suggestedPrice || 0) - calculatedPrices.total_cost_per_unit).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <p className="font-medium text-blue-800 mb-1">Resumo do Investimento</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Custo Total:</span>
                      <span>R$ {lotData.total_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Receita Potencial ({calculatedPrices.sizes?.[0] || 5}ml):</span>
                      <span>R$ {((calculatedPrices.prices?.[0]?.suggestedPrice || 0) * (lotData.qty_ml / (calculatedPrices.sizes?.[0] || 5))).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-blue-700">
                      <span>Lucro Estimado:</span>
                      <span>R$ {(((calculatedPrices.prices?.[0]?.suggestedPrice || 0) * (lotData.qty_ml / (calculatedPrices.sizes?.[0] || 5))) - lotData.total_cost).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {step === 'prices' && (
                  <Button 
                    onClick={handleApplyPrices}
                    disabled={loading}
                    className="w-full"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    {loading ? 'Aplicando...' : 'Aplicar Preços aos Produtos'}
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Complete o lote para visualizar preços calculados</p>
              </div>
            )}

            {step === 'complete' && (
              <div className="space-y-2">
                <Button 
                  onClick={() => window.location.href = '/admin/perfumes'}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Perfume Criado
                </Button>
                <Button 
                  onClick={resetForm}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Outro Produto
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status de Dependências */}
      <DependencyStatus 
        showMaterials={true}
        showStock={true}
        showPricing={true}
      />
    </div>
  );
};

export default AdminProductCadastro;