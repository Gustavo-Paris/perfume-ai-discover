import React from 'react';
import { Skeleton } from './skeleton';
import { Button } from './button';
import { motion } from 'framer-motion';

interface OptimizedLoadingStateProps {
  isLoading: boolean;
  isEmpty: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}

// Optimized loading state with better performance and UX
export const OptimizedLoadingState = ({
  isLoading,
  isEmpty,
  children,
  loadingComponent,
  emptyComponent
}: OptimizedLoadingStateProps) => {
  if (isLoading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductLoadingSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isEmpty && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  if (isEmpty) {
    return (
      <motion.div 
        className="text-center py-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-muted-foreground mb-4">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2" />
          </svg>
          <h3 className="text-lg font-medium">Nenhum item encontrado</h3>
          <p className="text-sm mt-2">Tente ajustar os filtros ou buscar por outros termos</p>
        </div>
      </motion.div>
    );
  }

  return <>{children}</>;
};

// High-performance product skeleton
export const ProductLoadingSkeleton = () => (
  <motion.div
    className="border rounded-xl p-4 space-y-4 bg-card"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Skeleton className="aspect-square w-full rounded-lg" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-8 w-full" />
    </div>
  </motion.div>
);

// Optimized infinite scroll loader
export const InfiniteScrollLoader = () => (
  <div className="flex justify-center py-8">
    <div className="flex items-center gap-2 text-muted-foreground">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      <span className="text-sm">Carregando mais produtos...</span>
    </div>
  </div>
);

// Empty state with action
interface EmptyStateWithActionProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  icon?: React.ReactNode;
}

export const EmptyStateWithAction = ({
  title,
  description,
  actionLabel,
  onAction,
  icon
}: EmptyStateWithActionProps) => (
  <motion.div 
    className="text-center py-16 px-4"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4 }}
  >
    {icon && (
      <div className="text-muted-foreground mb-4 flex justify-center">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
    <Button onClick={onAction} variant="outline">
      {actionLabel}
    </Button>
  </motion.div>
);