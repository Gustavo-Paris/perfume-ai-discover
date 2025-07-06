import React, { useEffect, useRef, useCallback } from 'react';
import { useIntersection } from '@/hooks/useIntersection';

interface InfiniteScrollListProps<T> {
  items: T[];
  loadMore: () => void;
  hasNextPage: boolean;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  threshold?: number;
}

export function InfiniteScrollList<T>({
  items,
  loadMore,
  hasNextPage,
  isLoading,
  isFetchingNextPage,
  renderItem,
  className = '',
  loadingComponent,
  emptyComponent,
  threshold = 0.1
}: InfiniteScrollListProps<T>) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isIntersecting = useIntersection(loadMoreRef, { threshold });

  // Load more when intersection observer triggers
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      loadMore();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, loadMore]);

  if (isLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return emptyComponent || (
      <div className="text-center p-8 text-muted-foreground">
        Nenhum item encontrado
      </div>
    );
  }

  return (
    <div className={className}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}
      
      {/* Intersection observer target */}
      <div ref={loadMoreRef} className="h-4" />
      
      {/* Loading indicator */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center p-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando mais...</span>
        </div>
      )}
      
      {/* End indicator */}
      {!hasNextPage && items.length > 0 && (
        <div className="text-center p-4 text-sm text-muted-foreground">
          Todos os itens foram carregados
        </div>
      )}
    </div>
  );
}