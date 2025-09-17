import { usePerfumePricesObject } from '@/hooks/usePerfumePrices';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface PricesDisplayModalProps {
  perfumeId?: string;
}

export const PricesDisplayModal = ({ perfumeId }: PricesDisplayModalProps) => {
  const { prices, availableSizes, isLoading } = usePerfumePricesObject(perfumeId);

  if (!perfumeId) {
    return (
      <div className="space-y-4">
        <div>
          <Label>Preços (Calculados Automaticamente)</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Selecione um perfume para ver os preços
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <Label>Preços (Calculados Automaticamente)</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Os preços são calculados automaticamente com base nos custos dos materiais e margem de lucro
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-3 border rounded-lg bg-muted/50">
              <Skeleton className="h-4 w-8 mb-2" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (availableSizes.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <Label>Preços (Calculados Automaticamente)</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Os preços são calculados automaticamente com base nos custos dos materiais e margem de lucro
          </p>
        </div>
        <div className="p-4 text-center text-muted-foreground border rounded-lg">
          Nenhum preço disponível. Configure os materiais e receitas primeiro.
        </div>
      </div>
    );
  }

  // Só mostrar tamanhos que têm preços calculados
  const calculatedSizes = availableSizes.filter(size => prices[size] && prices[size] > 0);

  return (
    <div className="space-y-4">
      <div>
        <Label>Preços (Calculados Automaticamente)</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Os preços são calculados automaticamente com base nos custos dos materiais e margem de lucro
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {calculatedSizes.map(size => (
          <div key={size} className="p-3 border rounded-lg bg-muted/50">
            <Label className="text-xs text-muted-foreground">{size}ml</Label>
            <p className="text-lg font-semibold">
              R$ {prices[size]?.toFixed(2) || '0.00'}
            </p>
          </div>
        ))}
      </div>
      {calculatedSizes.length === 0 && (
        <div className="p-4 text-center text-muted-foreground border rounded-lg">
          Preços não calculados. Configure a margem de lucro e materiais.
        </div>
      )}
    </div>
  );
};