import { useState } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUpdatePerfumeMargin } from '@/hooks/useUpdatePerfumeMargin';
import { usePerfumePricesObject } from '@/hooks/usePerfumePrices';

interface PerfumeMarginEditorProps {
  perfume: {
    id: string;
    name: string;
    brand: string;
    target_margin_percentage?: number;
    avg_cost_per_ml?: number;
  };
}

export const PerfumeMarginEditor = ({ perfume }: PerfumeMarginEditorProps) => {
  // PADRÃO: target_margin_percentage está como decimal no BD (ex: 2.0 = 200%)
  // Interface mostra como porcentagem para o usuário
  const currentMarginPercent = (perfume.target_margin_percentage || 2.0) * 100;
  
  const [isEditing, setIsEditing] = useState(false);
  const [marginValue, setMarginValue] = useState(currentMarginPercent);
  const updateMargin = useUpdatePerfumeMargin();
  
  // Buscar preços dinâmicos da nova estrutura
  const { prices, availableSizes, isLoading } = usePerfumePricesObject(perfume.id);

  const handleSave = async () => {
    try {
      // Converter de porcentagem para decimal antes de enviar
      const marginAsDecimal = marginValue / 100;
      
      console.log('Salvando margem:', { 
        marginPercent: marginValue, 
        marginDecimal: marginAsDecimal 
      });
      
      await updateMargin.mutateAsync({
        perfumeId: perfume.id,
        newMarginPercentage: marginAsDecimal
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar margem:', error);
    }
  };

  const handleCancel = () => {
    setMarginValue(currentMarginPercent);
    setIsEditing(false);
  };

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{perfume.brand} - {perfume.name}</h3>
          <p className="text-sm text-muted-foreground">
            Custo médio: R$ {(perfume.avg_cost_per_ml || 0).toFixed(2)}/ml
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Input
                type="number"
                value={marginValue}
                onChange={(e) => setMarginValue(parseFloat(e.target.value) || 0)}
                className="w-24 h-8"
                min="50"
                max="500"
                step="10"
                placeholder="200"
              />
              <span className="text-sm text-muted-foreground">%</span>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateMargin.isPending}
              >
                <Save className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <>
              <Badge variant="outline">
                {currentMarginPercent.toFixed(0)}% margem
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Preços Dinâmicos */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Preços Calculados:</p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando preços...</p>
        ) : availableSizes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {availableSizes.map(size => (
              <div key={size} className="text-center p-2 bg-muted rounded text-sm">
                <p className="text-muted-foreground">{size}ml</p>
                <p className="font-medium">
                  R$ {(prices[size] || 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum preço disponível</p>
        )}
      </div>
    </div>
  );
};