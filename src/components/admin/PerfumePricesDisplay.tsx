import { usePerfumePricesObject } from '@/hooks/usePerfumePrices';
import { Skeleton } from '@/components/ui/skeleton';

interface PerfumePricesDisplayProps {
  perfumeId: string;
}

const PerfumePricesDisplay = ({ perfumeId }: PerfumePricesDisplayProps) => {
  const { prices, availableSizes, isLoading } = usePerfumePricesObject(perfumeId);

  if (isLoading) {
    return (
      <div className="space-y-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  if (availableSizes.length === 0) {
    return <div className="text-sm text-gray-500">Sem preços configurados</div>;
  }

  return (
    <div className="text-sm space-y-1">
      {availableSizes.map(size => (
        <div key={size}>
          {size}ml: R$ {prices[size]?.toFixed(2) || '0.00'}
        </div>
      ))}
    </div>
  );
};

export default PerfumePricesDisplay;