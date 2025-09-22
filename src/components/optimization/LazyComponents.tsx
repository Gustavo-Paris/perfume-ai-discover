// FASE 3 - Code splitting e lazy loading otimizado
import React, { lazy, Suspense } from 'react';
import { OptimizedLoadingState, ProductLoadingSkeleton } from '../ui/LoadingStatesOptimized';

// Lazy load admin components (biggest bundle impact)
export const AdminPerfumesLazy = lazy(() => 
  import('../../pages/admin/AdminPerfumes').then(module => ({
    default: module.default
  }))
);

export const AdminInventoryLazy = lazy(() =>
  import('../../pages/admin/AdminInventory')
);

export const AdminDashboardLazy = lazy(() =>
  import('../../pages/admin/AdminDashboard')
);

export const AdminOrdersLazy = lazy(() =>
  import('../../pages/admin/AdminOrders')
);

export const AdminReviewsLazy = lazy(() =>
  import('../../pages/admin/AdminReviews')
);

// Lazy load heavy components  
export const AdvancedSearchBoxLazy = lazy(() =>
  import('../search/AdvancedSearchBox')
);

export const SupportChatLazy = lazy(() =>
  import('../support/SupportChat').then(module => ({
    default: module.SupportChat
  }))
);

// Lazy wrapper component with optimized loading
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  name?: string;
}

export const LazyWrapper = ({ 
  children, 
  fallback,
  name = 'Component'
}: LazyWrapperProps) => (
  <Suspense 
    fallback={
      fallback || (
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </div>
      )
    }
  >
    {children}
  </Suspense>
);

// High-performance lazy loading with preload capabilities
export class ComponentPreloader {
  private static preloadedComponents = new Set<string>();
  
  static preload(componentName: keyof typeof lazyComponents) {
    if (!this.preloadedComponents.has(componentName)) {
      lazyComponents[componentName]();
      this.preloadedComponents.add(componentName);
    }
  }
  
  static preloadMultiple(componentNames: (keyof typeof lazyComponents)[]) {
    componentNames.forEach(name => this.preload(name));
  }
}

// Registry of lazy components for preloading
const lazyComponents = {
  AdminPerfumes: () => import('../../pages/admin/AdminPerfumes'),
  AdminInventory: () => import('../../pages/admin/AdminInventory'),
  AdminDashboard: () => import('../../pages/admin/AdminDashboard'),
  AdminOrders: () => import('../../pages/admin/AdminOrders'),
  AdminReviews: () => import('../../pages/admin/AdminReviews'),
  AdvancedSearchBox: () => import('../search/AdvancedSearchBox'),
  SupportChat: () => import('../support/SupportChat')
};

// Hook for intelligent preloading based on user behavior
export const useIntelligentPreloading = () => {
  const preloadAdminComponents = () => {
    // Preload admin components when user hovers over admin menu
    ComponentPreloader.preloadMultiple([
      'AdminPerfumes',
      'AdminInventory',
      'AdminDashboard',
      'AdminOrders'
    ]);
  };
  
  const preloadSearchComponents = () => {
    // Preload search when user focuses on search input
    ComponentPreloader.preload('AdvancedSearchBox');
  };
  
  const preloadSupportComponents = () => {
    // Preload support chat on user engagement
    ComponentPreloader.preload('SupportChat');
  };
  
  return {
    preloadAdminComponents,
    preloadSearchComponents,
    preloadSupportComponents
  };
};