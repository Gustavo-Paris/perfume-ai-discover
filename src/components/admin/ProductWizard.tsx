import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, ArrowLeft, Package, DollarSign, Warehouse } from 'lucide-react';
import { useCreatePerfume } from '@/hooks/usePerfumes';
import { useCreateInventoryLot } from '@/hooks/useInventoryLots';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCalculateProductCost } from '@/hooks/useMaterials';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: WizardStep[] = [
  {
    id: 'perfume',
    title: 'Dados do Perfume',
    description: 'Informações básicas do perfume',
    icon: <Package className="h-5 w-5" />
  },
  {
    id: 'pricing',
    title: 'Precificação',
    description: 'Definir preços para diferentes tamanhos',
    icon: <DollarSign className="h-5 w-5" />
  },
  {
    id: 'stock',
    title: 'Estoque Inicial',
    description: 'Criar lote inicial de estoque',
    icon: <Warehouse className="h-5 w-5" />
  }
];

export const ProductWizard = ({ onComplete }: { onComplete?: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [createdPerfumeId, setCreatedPerfumeId] = useState<string>('');
  
  const { toast } = useToast();
  const createPerfume = useCreatePerfume();
  const createLot = useCreateInventoryLot();
  const { data: warehouses } = useWarehouses();
  const calculateProductCost = useCalculateProductCost();

  const [perfumeData, setPerfumeData] = useState({
    brand: '',
    name: '',
    description: '',
    family: '',
    gender: 'masculino' as 'masculino' | 'feminino' | 'unissex',
    top_notes: [] as string[],
    heart_notes: [] as string[],
    base_notes: [] as string[],
    category: '',
    image_url: '',
  });

  const [pricingData, setPricingData] = useState({
    price_2ml: null as number | null,
    price_5ml: null as number | null,
    price_10ml: null as number | null,
    total_cost: 0,
    cost_per_ml: 0,
    target_margin_percentage: 50,
  });

  const [stockData, setStockData] = useState({
    lot_code: '',
    qty_ml: 0,
    warehouse_id: '',
    supplier: '',
    expiry_date: '',
  });

  const parseNotes = (notesString: string): string[] => {
    return notesString.split(',').map(note => note.trim()).filter(note => note.length > 0);
  };

  const formatNotes = (notes: string[]) => notes.join(', ');

  // Função para calcular preços incluindo materiais
  const calculatePrices = () => {
    if (pricingData.total_cost > 0 && stockData.qty_ml > 0) {
      const costPerMl = pricingData.total_cost / stockData.qty_ml;
      const marginMultiplier = (1 + pricingData.target_margin_percentage / 100);
      
      return {
        cost_per_ml: costPerMl,
        price_2ml: costPerMl * 2 * marginMultiplier + 0.65, // Adicionar custo dos materiais estimado
        price_5ml: costPerMl * 5 * marginMultiplier + 0.95, // Frasco 5ml + etiqueta
        price_10ml: costPerMl * 10 * marginMultiplier + 1.35, // Frasco 10ml + etiqueta
      };
    }
    return {
      cost_per_ml: 0,
      price_2ml: 0,
      price_5ml: 0,
      price_10ml: 0,
    };
  };

  // Função para criar receitas padrão de materiais para o produto
  const createProductRecipes = async (perfumeId: string) => {
    try {
      // Buscar os materiais necessários
      const { data: materials, error: materialsError } = await supabase
        .from('materials')
        .select('id, name')
        .in('name', ['Frasco 2ml', 'Frasco 5ml', 'Frasco 10ml', 'Etiqueta Padrão'])
        .eq('is_active', true);

      if (materialsError) throw materialsError;

      const frascoMaterials = materials?.filter(m => m.name.includes('Frasco')) || [];
      const etiquetaId = materials?.find(m => m.name === 'Etiqueta Padrão')?.id;

      if (!etiquetaId) {
        console.warn('Etiqueta Padrão não encontrada');
        return;
      }

      // Criar receitas para cada tamanho
      const recipes = [];
      
      // Para cada frasco, criar receita com o frasco + etiqueta
      for (const frasco of frascoMaterials) {
        const sizeML = frasco.name === 'Frasco 2ml' ? 2 : 
                       frasco.name === 'Frasco 5ml' ? 5 : 10;
        
        // Adicionar o frasco
        recipes.push({
          perfume_id: perfumeId,
          size_ml: sizeML,
          material_id: frasco.id,
          quantity_needed: 1
        });
        
        // Adicionar a etiqueta
        recipes.push({
          perfume_id: perfumeId,
          size_ml: sizeML,
          material_id: etiquetaId,
          quantity_needed: 1
        });
      }

      // Inserir todas as receitas
      if (recipes.length > 0) {
        const { error: recipesError } = await supabase
          .from('product_recipes')
          .insert(recipes);

        if (recipesError) throw recipesError;
      }
    } catch (error) {
      console.error('Erro ao criar receitas do produto:', error);
      // Não vamos interromper o fluxo por causa disso
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return perfumeData.brand && perfumeData.name && perfumeData.family;
      case 1:
        return pricingData.total_cost > 0 && pricingData.target_margin_percentage > 0;
      case 2:
        return stockData.lot_code && stockData.qty_ml > 0 && stockData.warehouse_id;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios para continuar.",
        variant: "destructive"
      });
      return;
    }

    if (currentStep === 0) {
      // Criar o perfume
      try {
        // Calculate cost per ml from total cost and quantity
        const calculatedCostPerMl = pricingData.total_cost / stockData.qty_ml;
        setPricingData(prev => ({...prev, cost_per_ml: calculatedCostPerMl}));
        
        // Usar os preços calculados que incluem materiais
        const finalPrices = calculatePrices();
        
        const perfume = await createPerfume.mutateAsync({
          ...perfumeData,
          price_2ml: finalPrices.price_2ml,
          price_5ml: finalPrices.price_5ml,
          price_10ml: finalPrices.price_10ml,
          price_full: 0, // Not used anymore, set to 0
          target_margin_percentage: pricingData.target_margin_percentage,
        });
        setCreatedPerfumeId(perfume.id);
        
        // Criar receitas padrão para o produto (materiais necessários)
        await createProductRecipes(perfume.id);
        
        setCompletedSteps(prev => new Set([...prev, 0]));
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao criar perfume. Verifique os dados.",
          variant: "destructive"
        });
        return;
      }
    }

    if (currentStep === 1) {
      setCompletedSteps(prev => new Set([...prev, 1]));
    }

    if (currentStep === 2) {
      // Criar o lote de estoque
      try {
        await createLot.mutateAsync({
          ...stockData,
          perfume_id: createdPerfumeId,
          cost_per_ml: pricingData.cost_per_ml,
          total_cost: pricingData.total_cost,
          expiry_date: stockData.expiry_date || null,
        });
        setCompletedSteps(prev => new Set([...prev, 2]));
        toast({
          title: "Sucesso!",
          description: "Produto criado com sucesso com estoque inicial."
        });
        onComplete?.();
        return;
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao criar lote de estoque.",
          variant: "destructive"
        });
        return;
      }
    }

    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const renderStepIndicator = () => (
    <div className="flex justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`
            flex items-center justify-center w-10 h-10 rounded-full border-2 
            ${completedSteps.has(index) 
              ? 'bg-green-100 border-green-500 text-green-600' 
              : currentStep === index 
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-gray-100 border-gray-300 text-gray-400'
            }
          `}>
            {completedSteps.has(index) ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              step.icon
            )}
          </div>
          <div className="ml-3 hidden sm:block">
            <p className={`text-sm font-medium ${
              currentStep === index ? 'text-primary' : 'text-gray-500'
            }`}>
              {step.title}
            </p>
            <p className="text-xs text-gray-400">{step.description}</p>
          </div>
          {index < steps.length - 1 && (
            <ArrowRight className="h-4 w-4 text-gray-300 ml-4 hidden sm:block" />
          )}
        </div>
      ))}
    </div>
  );

  const renderPerfumeStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Dados do Perfume</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="brand">Marca *</Label>
            <Input
              id="brand"
              value={perfumeData.brand}
              onChange={(e) => setPerfumeData({ ...perfumeData, brand: e.target.value })}
              placeholder="Ex: Chanel, Dior"
            />
          </div>
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={perfumeData.name}
              onChange={(e) => setPerfumeData({ ...perfumeData, name: e.target.value })}
              placeholder="Ex: Bleu de Chanel"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={perfumeData.description}
            onChange={(e) => setPerfumeData({ ...perfumeData, description: e.target.value })}
            placeholder="Descrição detalhada do perfume..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="family">Família Olfativa *</Label>
            <Input
              id="family"
              value={perfumeData.family}
              onChange={(e) => setPerfumeData({ ...perfumeData, family: e.target.value })}
              placeholder="Ex: Amadeirado, Cítrico"
            />
          </div>
          <div>
            <Label htmlFor="gender">Gênero</Label>
            <Select 
              value={perfumeData.gender} 
              onValueChange={(value: any) => setPerfumeData({ ...perfumeData, gender: value })}
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
              onChange={(e) => setPerfumeData({ ...perfumeData, category: e.target.value })}
              placeholder="Ex: Premium, Designer"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Notas de Topo</Label>
            <Input
              value={formatNotes(perfumeData.top_notes)}
              onChange={(e) => setPerfumeData({ ...perfumeData, top_notes: parseNotes(e.target.value) })}
              placeholder="Bergamota, Limão, Grapefruit"
            />
          </div>
          <div>
            <Label>Notas de Coração</Label>
            <Input
              value={formatNotes(perfumeData.heart_notes)}
              onChange={(e) => setPerfumeData({ ...perfumeData, heart_notes: parseNotes(e.target.value) })}
              placeholder="Rosa, Jasmim, Gerânio"
            />
          </div>
          <div>
            <Label>Notas de Base</Label>
            <Input
              value={formatNotes(perfumeData.base_notes)}
              onChange={(e) => setPerfumeData({ ...perfumeData, base_notes: parseNotes(e.target.value) })}
              placeholder="Sândalo, Cedro, Almíscar"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="image_url">URL da Imagem</Label>
          <Input
            id="image_url"
            value={perfumeData.image_url}
            onChange={(e) => setPerfumeData({ ...perfumeData, image_url: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderPricingStep = () => {
    // Calculate cost per ml from total cost and quantity when both are available
    const calculatePrices = () => {
      if (pricingData.total_cost > 0 && stockData.qty_ml > 0) {
        const costPerMl = pricingData.total_cost / stockData.qty_ml;
        const marginMultiplier = (1 + pricingData.target_margin_percentage / 100);
        
        return {
          cost_per_ml: costPerMl,
          price_2ml: costPerMl * 2 * marginMultiplier + 0.65, // Adicionar custo dos materiais estimado
          price_5ml: costPerMl * 5 * marginMultiplier + 0.95, // Frasco 5ml + etiqueta
          price_10ml: costPerMl * 10 * marginMultiplier + 1.35, // Frasco 10ml + etiqueta
        };
      }
      return {
        cost_per_ml: 0,
        price_2ml: 0,
        price_5ml: 0,
        price_10ml: 0,
      };
    };

    const calculatedPrices = calculatePrices();

    return (
      <Card>
        <CardHeader>
          <CardTitle>Precificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-blue-700">
              <strong>Dica:</strong> Defina o custo total do lote e a margem desejada. 
              Os preços serão calculados automaticamente incluindo os custos dos materiais (frascos + etiquetas).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total_cost">Custo Total (R$) *</Label>
              <Input
                id="total_cost"
                type="number"
                step="0.01"
                value={pricingData.total_cost}
                onChange={(e) => {
                  const totalCost = Number(e.target.value);
                  setPricingData({ ...pricingData, total_cost: totalCost });
                }}
                placeholder="500.00"
              />
              {stockData.qty_ml > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Custo por ML: R$ {calculatedPrices.cost_per_ml.toFixed(4)}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="target_margin_percentage">Margem Alvo (%)</Label>
              <Input
                id="target_margin_percentage"
                type="number"
                value={pricingData.target_margin_percentage}
                onChange={(e) => {
                  const margin = Number(e.target.value);
                  setPricingData({ ...pricingData, target_margin_percentage: margin });
                }}
                placeholder="50"
              />
            </div>
          </div>

          {stockData.qty_ml > 0 && pricingData.total_cost > 0 && (
            <div className="border rounded-lg p-4 bg-green-50">
              <h4 className="font-medium mb-2 text-green-800">Composição do Preço (5ml):</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Perfume:</span>
                  <span>R$ {(calculatedPrices.cost_per_ml * 5).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frasco + Etiqueta:</span>
                  <span>R$ 0.95</span>
                </div>
                <div className="flex justify-between">
                  <span>Materiais:</span>
                  <span>R$ 0.95</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Custo Total:</span>
                  <span>R$ {(calculatedPrices.cost_per_ml * 5 + 0.95).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-700 font-medium">
                  <span>Margem ({pricingData.target_margin_percentage}%):</span>
                  <span>R$ {(calculatedPrices.price_5ml - (calculatedPrices.cost_per_ml * 5 + 0.95)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Preços Calculados (incluindo materiais)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Preço 2ml</Label>
                <div className="p-2 bg-gray-50 rounded border">
                  R$ {calculatedPrices.price_2ml.toFixed(2)}
                </div>
              </div>
              <div>
                <Label>Preço 5ml</Label>
                <div className="p-2 bg-gray-50 rounded border">
                  R$ {calculatedPrices.price_5ml.toFixed(2)}
                </div>
              </div>
              <div>
                <Label>Preço 10ml</Label>
                <div className="p-2 bg-gray-50 rounded border">
                  R$ {calculatedPrices.price_10ml.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {(!stockData.qty_ml || stockData.qty_ml === 0) && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-700">
                <strong>Atenção:</strong> Para calcular os preços automaticamente, primeiro preencha a quantidade em ML no próximo passo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderStockStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Estoque Inicial</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lot_code">Código do Lote *</Label>
            <Input
              id="lot_code"
              value={stockData.lot_code}
              onChange={(e) => setStockData({ ...stockData, lot_code: e.target.value })}
              placeholder="LOT001-2024"
            />
          </div>
          <div>
            <Label htmlFor="qty_ml">Quantidade (ml) *</Label>
            <Input
              id="qty_ml"
              type="number"
              value={stockData.qty_ml}
              onChange={(e) => setStockData({ ...stockData, qty_ml: Number(e.target.value) })}
              placeholder="1000"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="warehouse">Armazém *</Label>
            <Select 
              value={stockData.warehouse_id} 
              onValueChange={(value) => setStockData({ ...stockData, warehouse_id: value })}
            >
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
          <div>
            <Label htmlFor="supplier">Fornecedor</Label>
            <Input
              id="supplier"
              value={stockData.supplier}
              onChange={(e) => setStockData({ ...stockData, supplier: e.target.value })}
              placeholder="Nome do fornecedor"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="expiry_date">Data de Validade (opcional)</Label>
          <Input
            id="expiry_date"
            type="date"
            value={stockData.expiry_date}
            onChange={(e) => setStockData({ ...stockData, expiry_date: e.target.value })}
          />
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Resumo do Investimento</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Custo por ML:</span>
              <span>R$ {pricingData.cost_per_ml.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span>Quantidade:</span>
              <span>{stockData.qty_ml} ml</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Investimento Total:</span>
              <span>R$ {(pricingData.cost_per_ml * stockData.qty_ml).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderPerfumeStep();
      case 1:
        return renderPricingStep();
      case 2:
        return renderStockStep();
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {renderStepIndicator()}
      {renderStep()}
      
      <div className="flex justify-between mt-6">
        <Button 
          variant="outline" 
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <Button 
          onClick={handleNext}
          disabled={!validateCurrentStep() || createPerfume.isPending || createLot.isPending}
        >
          {currentStep === steps.length - 1 ? (
            createLot.isPending ? 'Finalizando...' : 'Finalizar'
          ) : createPerfume.isPending ? (
            'Criando perfume...'
          ) : (
            <>
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};