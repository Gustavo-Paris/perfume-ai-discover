import { useState } from 'react';
import { Bot, Eye, Plus, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDetectMaterialInfo } from '@/hooks/useMaterialConfigurations';
import { useMaterials } from '@/hooks/useMaterials';
import { debugLog, debugError } from '@/utils/removeDebugLogsProduction';

interface MaterialDetectionCardProps {
  onDetectedMaterial?: (material: any, detectionInfo: any) => void;
}

export default function MaterialDetectionCard({ onDetectedMaterial }: MaterialDetectionCardProps) {
  const [showPreviews, setShowPreviews] = useState(false);
  
  const { data: materials = [] } = useMaterials();
  const detectInfo = useDetectMaterialInfo();

  // Filtrar materiais que podem ser detectados
  const detectableMaterials = materials.filter(m => 
    m.name.match(/\d+ml/i) || 
    ['frasco', 'etiqueta', 'caixa'].some(type => 
      m.name.toLowerCase().includes(type)
    )
  );

  const handlePreviewDetection = async () => {
    setShowPreviews(true);
    
    // Detectar informações para todos os materiais detectáveis
    for (const material of detectableMaterials.slice(0, 5)) {
      try {
        const info = await detectInfo.mutateAsync(material.name);
        debugLog(`Material: ${material.name}`, info);
      } catch (error) {
        debugError('Erro na detecção:', error);
      }
    }
  };

  const getDetectionPreview = (materialName: string) => {
    // Simulação local da detecção para preview
    const sizeMatch = materialName.match(/(\d+)\s*ml/i);
    const size = sizeMatch ? parseInt(sizeMatch[1]) : null;
    
    let type = 'outro';
    if (/frasco|vidro|recipiente/i.test(materialName)) type = 'frasco';
    else if (/etiqueta|label/i.test(materialName)) type = 'etiqueta';
    else if (/caixa|box/i.test(materialName)) type = 'caixa';
    
    const affectsPricing = ['frasco', 'etiqueta'].includes(type);
    
    return { size, type, affectsPricing };
  };

  if (!detectableMaterials.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum material detectável encontrado.<br/>
              Cadastre materiais com nomes como "Frasco 10ml" ou "Etiqueta 5ml".
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-4 w-4" />
          Detecção Automática Ativa
          <Badge variant="outline" className="ml-auto">
            {detectableMaterials.length} materiais
          </Badge>
        </CardTitle>
        <CardDescription>
          Sistema identifica automaticamente tipos e tamanhos baseado nos nomes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreviewDetection}
              disabled={detectInfo.isPending}
            >
              <Eye className="h-3 w-3 mr-2" />
              {detectInfo.isPending ? 'Analisando...' : 'Prévia da Detecção'}
            </Button>
          </div>

          {showPreviews && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Prévia da Detecção Automática:
              </p>
              {detectableMaterials.slice(0, 5).map(material => {
                const preview = getDetectionPreview(material.name);
                return (
                  <div key={material.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                    <span className="font-medium">{material.name}</span>
                    <div className="flex gap-1">
                      {preview.size && (
                        <Badge variant="secondary" className="text-xs">
                          {preview.size}ml
                        </Badge>
                      )}
                      <Badge 
                        variant={preview.affectsPricing ? "default" : "outline"} 
                        className="text-xs"
                      >
                        {preview.type}
                      </Badge>
                      {preview.affectsPricing && (
                        <Badge variant="destructive" className="text-xs">
                          Afeta preço
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Como funciona:</strong> O sistema analisa o nome do material e detecta:
              • Tamanho (ex: "10ml") • Tipo (frasco, etiqueta, caixa) • Se afeta o preço final
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}