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
  Calculator
} from 'lucide-react';
import { useCreatePerfume, usePerfumesWithCosts } from '@/hooks/usePerfumes';
import { useCreateInventoryLot, useInventoryLots } from '@/hooks/useInventoryLots';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useToast } from '@/hooks/use-toast';
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
  cost_per_ml: number;
  warehouse_id: string;
  supplier: string;
  expiry_date: string;
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
    cost_per_ml: 0,
    warehouse_id: '',
    supplier: '',
    expiry_date: ''
  });

  const [marginPercentage, setMarginPercentage] = useState(50);
  const [currentPerfumeId, setCurrentPerfumeId] = useState<string>('');
  const [step, setStep] = useState<'perfume' | 'lot' | 'prices' | 'complete'>('perfume');
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();
  const createPerfume = useCreatePerfume();
  const createLot = useCreateInventoryLot();
  const { data: warehouses } = useWarehouses();
  const { data: perfumesWithCosts } = usePerfumesWithCosts();
  const { data: existingLots } = useInventoryLots();

  // Funções utilitárias
  const parseNotes = (notesString: string): string[] => {
    return notesString.split(',').map(note => note.trim()).filter(note => note.length > 0);
  };

  const formatNotes = (notes: string[]) => notes.join(', ');

  // Cálculo automático de preços
  const calculatePrices = () => {
    const baseMultiplier = 1 + (marginPercentage / 100);
    return {
      price_5ml: lotData.cost_per_ml * 5 * baseMultiplier,
      price_10ml: lotData.cost_per_ml * 10 * baseMultiplier,
      price_full: lotData.cost_per_ml * 50 * baseMultiplier
    };
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
    const newTotalCost = totalCost + (lotData.qty_ml * lotData.cost_per_ml);
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
        return lotData.lot_code && lotData.qty_ml > 0 && lotData.cost_per_ml > 0 && lotData.warehouse_id;
      case 'prices':
        return marginPercentage > 0;
      default:
        return false;
    }
  };

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
      const prices = calculatePrices();
      const perfume = await createPerfume.mutateAsync({
        ...perfumeData,
        ...prices
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
        ...lotData,
        perfume_id: currentPerfumeId,
        total_cost: lotData.qty_ml * lotData.cost_per_ml,
        expiry_date: lotData.expiry_date || null
      });

      // Atualizar preços do perfume com base no novo custo médio
      const prices = calculatePrices();
      await supabase
        .from('perfumes')
        .update(prices)
        .eq('id', currentPerfumeId);

      setStep('complete');
      toast({
        title: "Sucesso!",
        description: "Produto criado com estoque e preços atualizados!"
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

  const resetForm = () => {
    setPerfumeData({
      brand: '', name: '', description: '', family: '', gender: 'unissex',
      category: '', top_notes: [], heart_notes: [], base_notes: [], image_url: ''
    });
    setLotData({
      lot_code: '', qty_ml: 0, cost_per_ml: 0, warehouse_id: '', supplier: '', expiry_date: ''
    });
    setMarginPercentage(50);
    setCurrentPerfumeId('');
    setStep('perfume');
  };

  const prices = calculatePrices();
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
          step === 'complete' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">3. Completo</span>
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
                <Label htmlFor="cost_per_ml">Custo por ml (R$) *</Label>
                <Input
                  id="cost_per_ml"
                  type="number"
                  step="0.0001"
                  value={lotData.cost_per_ml}
                  onChange={(e) => setLotData({...lotData, cost_per_ml: Number(e.target.value)})}
                  placeholder="0.5000"
                  disabled={step === 'perfume' || step === 'complete'}
                />
              </div>
            </div>

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

        {/* Card 3: Preços e Margem */}
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
            <div>
              <Label htmlFor="margin">Margem de Lucro (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="margin"
                  type="number"
                  value={marginPercentage}
                  onChange={(e) => setMarginPercentage(Number(e.target.value))}
                  disabled={step === 'perfume'}
                />
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">5ml:</span>
                <span className="font-mono">R$ {prices.price_5ml.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">10ml:</span>
                <span className="font-mono">R$ {prices.price_10ml.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">50ml:</span>
                <span className="font-mono">R$ {prices.price_full.toFixed(2)}</span>
              </div>
            </div>

            <Separator />

            <div className="bg-green-50 p-3 rounded-lg text-sm">
              <p className="font-medium text-green-800 mb-1">Resumo do Investimento</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Custo Total:</span>
                  <span>R$ {(lotData.cost_per_ml * lotData.qty_ml).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Receita Potencial:</span>
                  <span>R$ {(prices.price_5ml * (lotData.qty_ml / 5)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium text-green-700">
                  <span>Lucro Estimado:</span>
                  <span>R$ {((prices.price_5ml * (lotData.qty_ml / 5)) - (lotData.cost_per_ml * lotData.qty_ml)).toFixed(2)}</span>
                </div>
              </div>
            </div>

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