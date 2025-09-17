import { useState } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUpdatePerfumeMargin } from '@/hooks/useUpdatePerfumeMargin';
import { usePerfumePricesObject } from '@/hooks/usePerfumePrices';
import { decimalToPercentage, formatMarginDisplay, isValidMargin, percentageToDecimal } from '@/utils/marginHelpers';

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
  // Converter decimal do banco para porcentagem da interface
  const initialMargin = decimalToPercentage(perfume.target_margin_percentage || 2.0);
  
  const [isEditing, setIsEditing] = useState(false);
  const [marginValue, setMarginValue] = useState(initialMargin);
  const [error, setError] = useState<string>('');
  
  const updateMargin = useUpdatePerfumeMargin();
  
  // Buscar preços dinâmicos da nova estrutura
  const { prices, availableSizes, isLoading } = usePerfumePricesObject(perfume.id);

  const handleSave = async () => {
    // Validar margem
    if (!isValidMargin(marginValue)) {
      setError('Margem deve estar entre 50% e 99%');
      return;
    }
    
    setError('');
    
    try {
      // Converter porcentagem para decimal antes de enviar
      await updateMargin.mutateAsync({
        perfumeId: perfume.id,
        newMarginPercentage: percentageToDecimal(marginValue) // Convertendo para decimal
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar margem:', error);
      setError('Erro ao atualizar margem');
    }
  };

  const handleCancel = () => {
    setMarginValue(initialMargin);
    setError('');
    setIsEditing(false);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setMarginValue(value);
    
    if (!isValidMargin(value)) {
      setError('Margem deve estar entre 50% e 99%');
    } else {
      setError('');
    }
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
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={marginValue}
                  onChange={handleValueChange}
                  className={`w-24 h-8 ${error ? 'border-red-500' : ''}`}
                  min="50"
                  max="99"
                  step="10"
                  placeholder="200"
                />
                <span className="text-sm text-muted-foreground">%</span>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateMargin.isPending || !!error}
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
              </div>
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
            </div>
          ) : (
            <>
              <Badge variant="outline">
                {formatMarginDisplay(perfume.target_margin_percentage)}
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

      {/* Status de atualização */}
      {updateMargin.isPending && (
        <div className="text-sm text-blue-600">
          Recalculando preços automaticamente...
        </div>
      )}

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