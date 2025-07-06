import React, { Suspense, lazy } from 'react';

interface LazyComponentProps {
  fallback?: React.ReactNode;
  className?: string;
}

// Lazy load heavy components to improve initial page load
export const LazyPerfumeDetails = lazy(() => import('@/pages/PerfumeDetails'));
export const LazyAdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
export const LazyReviewList = lazy(() => import('@/components/reviews/ReviewList'));
export const LazyCuradoria = lazy(() => import('@/pages/Curadoria'));

// Wrapper component for lazy loaded components
export const LazyWrapper: React.FC<LazyComponentProps & { children: React.ReactNode }> = ({
  children,
  fallback,
  className
}) => {
  const defaultFallback = (
    <div className={`flex items-center justify-center p-8 ${className || ''}`}>
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

// HOC for lazy loading components
export function withLazyLoading<P = {}>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);
  
  return (props: P) => (
    <LazyWrapper fallback={fallback}>
      <LazyComponent {...(props as any)} />
    </LazyWrapper>
  );
}