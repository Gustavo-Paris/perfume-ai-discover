import { useState, useEffect } from 'react';
import { Settings, Package, CheckCircle, Zap, Bot } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useMaterials } from '@/hooks/useMaterials';
import { useMaterialConfigurations, useSaveMaterialConfiguration } from '@/hooks/useMaterialConfigurations';
import { useRecalculateAllPerfumePrices } from '@/hooks/useRecalculateAllPerfumePrices';
import { toast } from 'sonner';

interface MaterialSetup {
  bottles: Array<{ size: number; materialId: string; materialName: string }>;
  defaultLabelId: string;
  defaultLabelName: string;
  autoDetectEnabled: boolean;
}

export default function MaterialSetupAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: materials = [] } = useMaterials();
  const { data: currentConfig } = useMaterialConfigurations();
  const saveMutation = useSaveMaterialConfiguration();
  const recalculateAllPrices = useRecalculateAllPerfumePrices();

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
    .sort((a, b) => (a?.size || 0) - (b?.size || 0)) as Array<{ size: number; materialId: string; materialName: string }>;

  // Detectar etiquetas
  const availableLabels = materials.filter(m => m.category === 'etiqueta' && m.is_active);

  const [setup, setSetup] = useState<MaterialSetup>({
    bottles: detectedBottles,
    defaultLabelId: availableLabels[0]?.id || '',
    defaultLabelName: availableLabels[0]?.name || '',
    autoDetectEnabled: true,
  });

  // Carregar configuração existente
  useEffect(() => {
    if (currentConfig) {
      setSetup({
        bottles: currentConfig.bottle_materials.map(b => ({
          size: b.size_ml,
          materialId: b.material_id,
          materialName: b.material_name
        })),
        defaultLabelId: currentConfig.default_label_id || '',
        defaultLabelName: currentConfig.default_label_name || '',
        autoDetectEnabled: currentConfig.auto_detect_enabled,
      });
    }
  }, [currentConfig]);

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
      .sort((a, b) => (a?.size || 0) - (b?.size || 0)) as Array<{ size: number; materialId: string; materialName: string }>;

    setSetup(prev => ({ ...prev, bottles }));
    toast.success(`${bottles.length} tamanhos de frascos detectados!`);
  };

  const handleSaveConfiguration = async () => {
    try {
      // Detect new sizes compared to current configuration
      const currentSizes = currentConfig?.bottle_materials.map(b => b.size_ml) || [];
      const newSizes = setup.bottles.map(b => b.size).filter(size => !currentSizes.includes(size));
      
      // Save configuration first
      await saveMutation.mutateAsync({
        bottle_materials: setup.bottles.map(b => ({
          size_ml: b.size,
          material_id: b.materialId,
          material_name: b.materialName
        })),
        default_label_id: setup.defaultLabelId || null,
        default_label_name: setup.defaultLabelName || null,
        auto_detect_enabled: setup.autoDetectEnabled,
      });

      // If there are new sizes, trigger automatic price recalculation
      if (newSizes.length > 0) {
        toast.info(`🔄 Recalculando preços para ${newSizes.length} novo(s) tamanho(s)...`);
        await recalculateAllPrices.mutateAsync(newSizes);
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Settings className="h-4 w-4 mr-2" />
          Configurar Materiais
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Assistente de Setup Inicial
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-6">
            <div className="text-center">
              <Bot className="h-10 w-10 mx-auto text-primary mb-3" />
              <h3 className="text-lg font-semibold">Assistente Inteligente de Materiais</h3>
              <p className="text-muted-foreground text-sm">
                Configure uma vez e automatize o cadastro de novos produtos
              </p>
            </div>

            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-4 w-4" />
                    Frascos Detectados ({setup.bottles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {setup.bottles.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum frasco detectado</p>
                      <p className="text-xs">Cadastre materiais do tipo "frasco" primeiro</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {setup.bottles.map(bottle => (
                        <div key={bottle.materialId} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                          <span className="text-sm font-medium">{bottle.materialName}</span>
                          <Badge variant="outline">{bottle.size}ml</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={handleDetectMaterials}
                  >
                    <Settings className="h-3 w-3 mr-2" />
                    Atualizar Detecção
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Etiqueta Padrão</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={setup.defaultLabelId} 
                    onValueChange={(value) => {
                      const label = availableLabels.find(l => l.id === value);
                      setSetup(prev => ({ 
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
                  {setup.defaultLabelName && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Selecionado: {setup.defaultLabelName}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Detecção Automática
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-detect"
                      checked={setup.autoDetectEnabled}
                      onCheckedChange={(checked) => 
                        setSetup(prev => ({ ...prev, autoDetectEnabled: checked }))
                      }
                    />
                    <Label htmlFor="auto-detect" className="text-sm">
                      Detectar automaticamente novos tamanhos de frascos
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Quando ativado, o sistema identifica automaticamente materiais do tipo "frasco" 
                    e sugere configurações baseadas no tamanho detectado.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-accent/10 border-accent/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-accent-foreground mt-0.5" />
                    <div>
                      <h4 className="font-medium text-accent-foreground text-sm">Automação Inteligente</h4>
                      <p className="text-xs text-accent-foreground/80 mt-1">
                        • <strong>Detecção Automática:</strong> Identifica frascos e etiquetas pelo nome<br/>
                        • <strong>Configuração Dinâmica:</strong> Auto-configura novos tamanhos<br/>
                        • <strong>Recálculo Automático:</strong> Atualiza preços quando materiais mudam<br/>
                        • <strong>Integração Total:</strong> Funciona automaticamente no cadastro de produto
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveConfiguration}
              disabled={saveMutation.isPending || recalculateAllPrices.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Salvando...' : 
               recalculateAllPrices.isPending ? 'Recalculando preços...' :
               'Salvar Configuração'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}