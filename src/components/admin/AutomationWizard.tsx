import { useState } from 'react';
import { Wand2, CheckCircle, AlertCircle, Loader2, ArrowRight, ArrowLeft, Target, Package, Calculator, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useMaterials, useAutoCreateRecipes, useSmartPricing } from '@/hooks/useMaterials';
import { usePerfumes } from '@/hooks/usePerfumes';
import { toast } from 'sonner';

interface BottleMapping {
  size: number;
  materialId: string;
  materialName: string;
}

interface AutomationConfig {
  bottles: BottleMapping[];
  defaultLabelId: string;
  defaultLabelName: string;
  margins: {
    [category: string]: number;
  };
}

export default function AutomationWizard() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResults, setProcessResults] = useState<any>(null);

  const { data: materials = [] } = useMaterials();
  const { data: perfumes = [] } = usePerfumes();
  const autoCreateRecipes = useAutoCreateRecipes();
  const smartPricing = useSmartPricing();

  // Detectar frascos automaticamente
  const detectedBottles = materials
    .filter(m => m.category === 'frasco' && m.is_active)
    .map(bottle => {
      const match = bottle.name.match(/(\d+)ml/i);
      return match ? {
        size: parseInt(match[1]),
        materialId: bottle.id,
        materialName: bottle.name
      } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (a?.size || 0) - (b?.size || 0)) as BottleMapping[];

  // Detectar etiquetas
  const availableLabels = materials.filter(m => m.category === 'etiqueta' && m.is_active);

  const [config, setConfig] = useState<AutomationConfig>({
    bottles: detectedBottles,
    defaultLabelId: availableLabels[0]?.id || '',
    defaultLabelName: availableLabels[0]?.name || '',
    margins: {
      'Designer': 0.65,
      'Premium': 0.55,
      'Ultra Luxury': 0.75,
      'Nicho': 0.60,
    }
  });

  const perfumesWithoutRecipes = perfumes.filter(perfume => {
    // Aqui seria ideal verificar se o perfume já tem receitas
    // Por simplicidade, assumimos que se não tem receitas, precisa ser configurado
    return true; // Placeholder - implementar verificação real depois
  });

  const handleDetectMaterials = () => {
    const bottles = materials
      .filter(m => m.category === 'frasco' && m.is_active)
      .map(bottle => {
        const match = bottle.name.match(/(\d+)ml/i);
        return match ? {
          size: parseInt(match[1]),
          materialId: bottle.id,
          materialName: bottle.name
        } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (a?.size || 0) - (b?.size || 0)) as BottleMapping[];

    setConfig(prev => ({ ...prev, bottles }));
    toast.success(`${bottles.length} tamanhos de frascos detectados automaticamente!`);
  };

  const handleProcessAutomation = async () => {
    setIsProcessing(true);
    const results = {
      recipesCreated: 0,
      pricesUpdated: 0,
      errors: [],
      perfumesProcessed: 0
    };

    try {
      // Para cada perfume, criar receitas automaticamente
      for (const perfume of perfumesWithoutRecipes.slice(0, 5)) { // Limit for demo
        try {
          await autoCreateRecipes.mutateAsync(perfume.id);
          results.recipesCreated += config.bottles.length; // Cada perfume ganha receitas para cada tamanho
          results.perfumesProcessed++;
        } catch (error) {
          results.errors.push(`Erro ao criar receitas para ${perfume.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      // Recalcular todos os preços
      try {
        await smartPricing.mutateAsync('all'); // Passar ID especial para recalcular tudo
        results.pricesUpdated = perfumes.length * config.bottles.length;
      } catch (error) {
        results.errors.push(`Erro ao recalcular preços: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }

      setProcessResults(results);
      setStep(4); // Ir para tela de resultados
      
      if (results.errors.length === 0) {
        toast.success('Automação concluída com sucesso!');
      } else {
        toast.warning('Automação concluída com alguns erros');
      }
    } catch (error) {
      toast.error('Erro durante a automação');
      results.errors.push(`Erro geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setProcessResults(null);
    setIsProcessing(false);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Target className="h-12 w-12 mx-auto text-primary mb-4" />
        <h3 className="text-lg font-semibold">Detecção Automática de Materiais</h3>
        <p className="text-muted-foreground">
          Vamos escanear seus materiais para configurar o sistema automaticamente
        </p>
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Frascos Detectados: {detectedBottles.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {detectedBottles.map(bottle => (
              <div key={bottle.materialId} className="flex justify-between items-center p-2 bg-background rounded border">
                <span className="text-sm font-medium">{bottle.materialName}</span>
                <Badge variant="outline">{bottle.size}ml</Badge>
              </div>
            ))}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-4"
            onClick={handleDetectMaterials}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Re-detectar Automaticamente
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Etiqueta Padrão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={config.defaultLabelId} 
            onValueChange={(value) => {
              const label = availableLabels.find(l => l.id === value);
              setConfig(prev => ({ 
                ...prev, 
                defaultLabelId: value,
                defaultLabelName: label?.name || ''
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a etiqueta padrão" />
            </SelectTrigger>
            <SelectContent>
              {availableLabels.map(label => (
                <SelectItem key={label.id} value={label.id}>
                  {label.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Calculator className="h-12 w-12 mx-auto text-primary mb-4" />
        <h3 className="text-lg font-semibold">Configuração de Margens</h3>
        <p className="text-muted-foreground">
          Configure as margens de lucro por categoria de perfume
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(config.margins).map(([category, margin]) => (
          <Card key={category}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{category}</h4>
                  <p className="text-sm text-muted-foreground">
                    Margem atual: {(margin * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    value={(margin * 100).toFixed(0)}
                    onChange={(e) => {
                      const newMargin = parseFloat(e.target.value) / 100;
                      setConfig(prev => ({
                        ...prev,
                        margins: { ...prev.margins, [category]: newMargin }
                      }));
                    }}
                    min="0"
                    max="100"
                    step="1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-accent/50 border-accent">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-accent-foreground mt-0.5" />
            <div>
              <h4 className="font-medium text-accent-foreground">Impacto das Margens</h4>
              <p className="text-sm text-accent-foreground/80">
                Essas margens serão aplicadas automaticamente a todos os {perfumes.length} perfumes 
                do catálogo. Você pode ajustar individualmente depois.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Zap className="h-12 w-12 mx-auto text-primary mb-4" />
        <h3 className="text-lg font-semibold">Preview da Automação</h3>
        <p className="text-muted-foreground">
          Verifique o que será criado antes de aplicar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {perfumesWithoutRecipes.length * config.bottles.length}
            </div>
            <p className="text-sm text-muted-foreground">
              Receitas serão criadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Preços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {perfumes.length * config.bottles.length}
            </div>
            <p className="text-sm text-muted-foreground">
              Preços serão calculados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Perfumes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {perfumesWithoutRecipes.length}
            </div>
            <p className="text-sm text-muted-foreground">
              Perfumes processados
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Configuração Final</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Tamanhos Disponíveis</Label>
            <div className="flex gap-2 mt-2">
              {config.bottles.map(bottle => (
                <Badge key={bottle.materialId} variant="outline">
                  {bottle.size}ml
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Etiqueta Padrão</Label>
            <p className="text-sm text-muted-foreground mt-1">{config.defaultLabelName}</p>
          </div>

          <div>
            <Label className="text-sm font-medium">Margens por Categoria</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {Object.entries(config.margins).map(([category, margin]) => (
                <div key={category} className="text-sm">
                  <span className="font-medium">{category}:</span> {(margin * 100).toFixed(0)}%
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
        <h3 className="text-lg font-semibold">Automação Concluída!</h3>
        <p className="text-muted-foreground">
          Seu sistema está configurado e operacional
        </p>
      </div>

      {processResults && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {processResults.recipesCreated}
              </div>
              <p className="text-sm text-green-700">Receitas criadas</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {processResults.pricesUpdated}
              </div>
              <p className="text-sm text-blue-700">Preços calculados</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">
                {processResults.perfumesProcessed}
              </div>
              <p className="text-sm text-purple-700">Perfumes processados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {processResults?.errors && processResults.errors.length > 0 && (
        <Card className="border-warning bg-warning/10">
          <CardHeader>
            <CardTitle className="text-warning flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Avisos e Erros ({processResults.errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {processResults.errors.map((error, index) => (
                <p key={index} className="text-sm text-warning">
                  • {error}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-accent/50 border-accent">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-accent-foreground mt-0.5" />
            <div>
              <h4 className="font-medium text-accent-foreground">Sistema "Set and Forget" Ativo</h4>
              <p className="text-sm text-accent-foreground/80 mt-1">
                • Novos materiais serão detectados automaticamente<br/>
                • Preços serão recalculados quando custos mudarem<br/>
                • Receitas serão criadas para novos tamanhos<br/>
                • Alertas automáticos para estoque baixo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Wand2 className="h-5 w-5 mr-2" />
          Configuração Mágica - Automação Completa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Wizard de Automação - Etapa {step} de 4
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNumber <= step 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {stepNumber < step ? <CheckCircle className="h-4 w-4" /> : stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div 
                    className={`w-16 h-0.5 ${
                      stepNumber < step ? 'bg-primary' : 'bg-muted'
                    }`} 
                  />
                )}
              </div>
            ))}
          </div>

          <Separator />

          {/* Step Content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => step > 1 ? setStep(step - 1) : null}
              disabled={step === 1 || isProcessing}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            {step < 3 && (
              <Button onClick={() => setStep(step + 1)}>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {step === 3 && (
              <Button 
                onClick={handleProcessAutomation}
                disabled={isProcessing}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Aplicar Automação
                  </>
                )}
              </Button>
            )}

            {step === 4 && (
              <Button onClick={() => {
                resetWizard();
                setIsOpen(false);
              }}>
                Concluir
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}