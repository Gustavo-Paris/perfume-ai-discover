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
  const [isEditing, setIsEditing] = useState(false);
  const [marginValue, setMarginValue] = useState(perfume.target_margin_percentage || 200);
  const updateMargin = useUpdatePerfumeMargin();
  const { prices, availableSizes, isLoading } = usePerfumePricesObject(perfume.id);

  const handleSave = async () => {
    try {
      await updateMargin.mutateAsync({
        perfumeId: perfume.id,
        newMarginPercentage: marginValue
      });
      setIsEditing(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleCancel = () => {
    setMarginValue(perfume.target_margin_percentage || 200);
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
                className="w-20 h-8"
                min="0"
                step="10"
              />
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
                {perfume.target_margin_percentage || 200}% margem
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

      {/* Mostrar preços dinâmicos da nova tabela */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        {isLoading ? (
          <div className="col-span-3 text-center text-muted-foreground">
            Carregando preços...
          </div>
        ) : availableSizes.length > 0 ? (
          availableSizes.slice(0, 3).map(size => (
            <div key={size} className="text-center p-2 bg-muted rounded">
              <p className="text-muted-foreground">{size}ml</p>
              <p className="font-medium">R$ {(prices[size] || 0).toFixed(2)}</p>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center text-muted-foreground">
            Nenhum preço calculado
          </div>
        )}
      </div>
    </div>
  );
};