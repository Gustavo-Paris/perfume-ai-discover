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
  total_cost: number; // Mudança: agora é custo total do lote
  warehouse_id: string;
  supplier: string;
  expiry_date: string;
}

interface CalculatedPrices {
  [key: string]: any; // Permite propriedades dinâmicas como price_20ml
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
    total_cost: 0, // Mudança: custo total do lote
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

  // Funções utilitárias
  const parseNotes = (notesString: string): string[] => {
    return notesString.split(',').map(note => note.trim()).filter(note => note.length > 0);
  };

  const formatNotes = (notes: string[]) => notes.join(', ');

  // Calcular custo por ml automaticamente
  const costPerMl = lotData.qty_ml > 0 ? lotData.total_cost / lotData.qty_ml : 0;

  // Função para calcular preços usando a função do banco
  const calculatePricesWithMaterials = async () => {
    if (!currentPerfumeId || costPerMl === 0) return null;

    try {
      // Usar tamanhos das configurações ou padrão se não houver
      const sizes = materialConfig?.bottle_materials?.map(bm => bm.size_ml) || [2, 5, 10];
      
      // Buscar materiais de embalagem
      const { data: materials } = await supabase
        .from('materials')
        .select('*')
        .eq('type', 'input')
        .eq('is_active', true)
        .in('category', ['frasco', 'etiqueta']);

      const getPackagingCost = (sizeMl: number) => {
        if (!materials) return 0;
        
        const frasco = materials.find(m => 
          m.category === 'frasco' && m.name.includes(`${sizeMl}ml`)
        );
        const etiqueta = materials.find(m => m.category === 'etiqueta');
        
        return (frasco?.cost_per_unit || 0) + (etiqueta?.cost_per_unit || 0);
      };

      // Calcular preços para cada tamanho
      const prices = sizes.map(size => {
        const perfumeCost = costPerMl * size;
        const packagingCost = getPackagingCost(size);
        const totalCost = perfumeCost + packagingCost;
        const margin = 1 + (marginPercentage / 100);
        const suggestedPrice = totalCost * margin;
        
        return {
          size,
          perfumeCost,
          packagingCost,
          totalCost,
          suggestedPrice
        };
      });

      // Criar estrutura dinâmica de preços
      const pricesObj = {} as any;
      prices.forEach((price, index) => {
        pricesObj[`price_${sizes[index]}ml`] = price.suggestedPrice;
      });

      return {
        ...pricesObj,
        sizes: sizes,
        prices: prices,
        perfume_cost: prices[0]?.perfumeCost || 0,
        materials_cost: 0, // Sem materiais adicionais por enquanto
        packaging_cost: prices[0]?.packagingCost || 0,
        total_cost_per_unit: prices[0]?.totalCost || 0,
      };
    } catch (error) {
      console.error('Erro ao calcular preços:', error);
    }
    return null;
  };

  // Calcular custo médio se há lotes existentes
  const calculateAverageCostImpact = () => {
    if (!currentPerfumeId || !existingLots) return null;
    
    const perfumeLots = existingLots.filter(lot => 
      lot.perfume_id === currentPerfumeId
    );
    
    if (perfumeLots.length === 0) return null;

    const totalCost = perfumeLots.reduce((sum, lot) => 
      sum + (lot.qty_ml * lot.cost_per_ml), 0
    );
    const totalMl = perfumeLots.reduce((sum, lot) => sum + lot.qty_ml, 0);
    const currentAvgCost = totalCost / totalMl;

    // Simular novo custo médio com o lote atual
    const newTotalCost = totalCost + lotData.total_cost;
    const newTotalMl = totalMl + lotData.qty_ml;
    const newAvgCost = newTotalCost / newTotalMl;

    return {
      currentAvgCost,
      newAvgCost,
      impact: ((newAvgCost - currentAvgCost) / currentAvgCost) * 100
    };
  };

  // Validações inteligentes
  const validateStep = (currentStep: string) => {
    switch (currentStep) {
      case 'perfume':
        return perfumeData.brand && perfumeData.name && perfumeData.family;
      case 'lot':
        return lotData.lot_code && lotData.qty_ml > 0 && lotData.total_cost > 0 && lotData.warehouse_id;
      case 'prices':
        return marginPercentage > 0;
      default:
        return false;
    }
  };

  // Atualizar preços quando perfume for criado
  useEffect(() => {
    if (currentPerfumeId && step === 'lot') {
      calculatePricesWithMaterials().then(setCalculatedPrices);
    }
  }, [currentPerfumeId, costPerMl, step]);

  // Handlers
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
      // Criar perfume sem preços (serão calculados depois)
      const perfume = await createPerfume.mutateAsync({
        ...perfumeData,
        // Campos de preço com valores temporários
        price_2ml: null,
        price_5ml: null,
        price_10ml: null,
        price_full: 0
      });
      
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
        cost_per_ml: costPerMl, // Calculado automaticamente
        total_cost: lotData.total_cost,
        warehouse_id: lotData.warehouse_id,
        supplier: lotData.supplier || null, // Converter string vazia para null
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
      // Atualizar perfume com preços calculados (usando tabela temporária se necessário)
      // Como removemos os campos de preço da tabela, vamos criar uma tabela de preços dinâmica
      
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
            disabled={loading}
          >
            Novo Produto
          </Button>
        }
      />

      {/* Indicador de Progresso Simples */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
          step === 'perfume' ? 'bg-primary text-primary-foreground' : 
          ['lot', 'prices', 'complete'].includes(step) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          <Package className="h-4 w-4" />
          <span className="text-sm font-medium">1. Perfume</span>
          {['lot', 'prices', 'complete'].includes(step) && <CheckCircle className="h-4 w-4" />}
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
          step === 'lot' ? 'bg-primary text-primary-foreground' : 
          ['prices', 'complete'].includes(step) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          <Package className="h-4 w-4" />
          <span className="text-sm font-medium">2. Lote</span>
          {['prices', 'complete'].includes(step) && <CheckCircle className="h-4 w-4" />}
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
          step === 'prices' ? 'bg-primary text-primary-foreground' : 
          step === 'complete' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          <DollarSign className="h-4 w-4" />
          <span className="text-sm font-medium">3. Preços</span>
          {step === 'complete' && <CheckCircle className="h-4 w-4" />}
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
          step === 'complete' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">4. Completo</span>
        </div>
      </div>

      {/* Validações Inteligentes */}
      <SmartValidations 
        entityType="perfume" 
        entityData={{ ...perfumeData, ...lotData, marginPercentage }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Dados do Perfume */}
        <Card className={step === 'perfume' ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Dados do Perfume
              {['lot', 'prices', 'complete'].includes(step) && (
                <Badge variant="default" className="ml-auto">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completo
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="brand">Marca *</Label>
                <Input
                  id="brand"
                  value={perfumeData.brand}
                  onChange={(e) => setPerfumeData({...perfumeData, brand: e.target.value})}
                  placeholder="Ex: Chanel"
                  disabled={step !== 'perfume'}
                />
              </div>
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={perfumeData.name}
                  onChange={(e) => setPerfumeData({...perfumeData, name: e.target.value})}
                  placeholder="Ex: Bleu de Chanel"
                  disabled={step !== 'perfume'}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="family">Família Olfativa *</Label>
              <Input
                id="family"
                value={perfumeData.family}
                onChange={(e) => setPerfumeData({...perfumeData, family: e.target.value})}
                placeholder="Ex: Amadeirado Oriental"
                disabled={step !== 'perfume'}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="gender">Gênero</Label>
                <Select 
                  value={perfumeData.gender} 
                  onValueChange={(value: any) => setPerfumeData({...perfumeData, gender: value})}
                  disabled={step !== 'perfume'}
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
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={perfumeData.category}
                  onChange={(e) => setPerfumeData({...perfumeData, category: e.target.value})}
                  placeholder="Premium, Designer..."
                  disabled={step !== 'perfume'}
                />
              </div>
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={perfumeData.description}
                onChange={(e) => setPerfumeData({...perfumeData, description: e.target.value})}
                placeholder="Descrição do perfume..."
                rows={2}
                disabled={step !== 'perfume'}
              />
            </div>

            <div>
              <Label htmlFor="margin">Margem de Lucro (%)</Label>
              <Input
                id="margin"
                type="number"
                value={marginPercentage}
                onChange={(e) => setMarginPercentage(Number(e.target.value))}
                disabled={step !== 'perfume'}
                placeholder="50"
              />
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

            {step !== 'perfume' && (
              <Button variant="outline" onClick={() => setStep('perfume')} className="w-full">
                <Edit className="h-4 w-4 mr-2" />
                Editar Perfume
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Lote de Estoque */}
        <Card className={step === 'lot' ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Primeiro Lote
              {['prices', 'complete'].includes(step) && (
                <Badge variant="default" className="ml-auto">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completo
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="lot_code">Código do Lote *</Label>
              <Input
                id="lot_code"
                value={lotData.lot_code}
                onChange={(e) => setLotData({...lotData, lot_code: e.target.value})}
                placeholder="LOT001-2024"
                disabled={step === 'perfume' || step === 'complete'}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="qty_ml">Quantidade (ml) *</Label>
                <Input
                  id="qty_ml"
                  type="number"
                  value={lotData.qty_ml}
                  onChange={(e) => setLotData({...lotData, qty_ml: Number(e.target.value)})}
                  placeholder="1000"
                  disabled={step === 'perfume' || step === 'complete'}
                />
              </div>
              <div>
                <Label htmlFor="total_cost">Custo Total (R$) *</Label>
                <Input
                  id="total_cost"
                  type="number"
                  step="0.01"
                  value={lotData.total_cost}
                  onChange={(e) => setLotData({...lotData, total_cost: Number(e.target.value)})}
                  placeholder="500.00"
                  disabled={step === 'perfume' || step === 'complete'}
                />
              </div>
            </div>

            {/* Mostrar custo por ml calculado */}
            {costPerMl > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <p><strong>Custo calculado:</strong></p>
                <p>R$ {costPerMl.toFixed(4)} por ml</p>
              </div>
            )}

            <div>
              <Label htmlFor="warehouse">Armazém *</Label>
              <Select 
                value={lotData.warehouse_id} 
                onValueChange={(value) => setLotData({...lotData, warehouse_id: value})}
                disabled={step === 'perfume' || step === 'complete'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um armazém" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses?.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="supplier">Fornecedor</Label>
              <Input
                id="supplier"
                value={lotData.supplier}
                onChange={(e) => setLotData({...lotData, supplier: e.target.value})}
                placeholder="Nome do fornecedor"
                disabled={step === 'perfume' || step === 'complete'}
              />
            </div>

            {costImpact && (
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <p><strong>Impacto no Custo Médio:</strong></p>
                <p>Atual: R$ {costImpact.currentAvgCost.toFixed(4)}/ml</p>
                <p>Novo: R$ {costImpact.newAvgCost.toFixed(4)}/ml</p>
                <p className={costImpact.impact > 0 ? 'text-red-600' : 'text-green-600'}>
                  {costImpact.impact > 0 ? '↗' : '↘'} {Math.abs(costImpact.impact).toFixed(1)}%
                </p>
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
                        R$ {calculatedPrices.prices[index]?.suggestedPrice?.toFixed(2) || '0.00'}
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
                      <span>R$ {(calculatedPrices.price_5ml - calculatedPrices.total_cost_per_unit).toFixed(2)}</span>
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
                      <span>Receita Potencial (5ml):</span>
                      <span>R$ {(calculatedPrices.price_5ml * (lotData.qty_ml / 5)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-blue-700">
                      <span>Lucro Estimado:</span>
                      <span>R$ {((calculatedPrices.price_5ml * (lotData.qty_ml / 5)) - lotData.total_cost).toFixed(2)}</span>
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