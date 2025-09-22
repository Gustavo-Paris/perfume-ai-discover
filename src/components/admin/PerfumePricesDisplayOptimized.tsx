import React, { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface PerfumePricesDisplayOptimizedProps {
  perfumeId: string;
  prices?: Record<number, number>; // Preços já calculados passados como prop
  availableSizes?: number[];
  isLoading?: boolean;
}

const PerfumePricesDisplayOptimized = ({ 
  perfumeId, 
  prices = {}, 
  availableSizes = [], 
  isLoading = false 
}: PerfumePricesDisplayOptimizedProps) => {
  
  // Memoizar cálculos para evitar re-renders desnecessários
  const calculatedSizes = useMemo(() => {
    return availableSizes.filter(size => prices[size] && prices[size] > 0);
  }, [availableSizes, prices]);

  if (isLoading) {
    return (
      <div className="space-y-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  if (calculatedSizes.length === 0) {
    return <div className="text-sm text-muted-foreground">Sem preços</div>;
  }

  return (
    <div className="text-sm space-y-1">
      {calculatedSizes.map(size => (
        <div key={size} className="flex justify-between">
          <span>{size}ml:</span>
          <span className="font-medium">R$ {prices[size]?.toFixed(2) || '0.00'}</span>
        </div>
      ))}
    </div>
  );
};

export default PerfumePricesDisplayOptimized;