// FASE 4 - Query optimization e cache estratégico
import React from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { trackApiCall, performanceMonitor } from '../utils/performanceMonitorOptimized';
import { debugLog } from '../utils/removeDebugLogsProduction';

// Cache configuration per data type
const CACHE_CONFIGS = {
  perfumes: { staleTime: 10 * 60 * 1000, gcTime: 15 * 60 * 1000 }, // 10/15 min
  prices: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 },    // 5/10 min
  reviews: { staleTime: 2 * 60 * 1000, gcTime: 5 * 60 * 1000 },    // 2/5 min
  user: { staleTime: 30 * 60 * 1000, gcTime: 60 * 60 * 1000 },     // 30/60 min
  admin: { staleTime: 1 * 60 * 1000, gcTime: 2 * 60 * 1000 }       // 1/2 min
};

// Optimized perfume queries with intelligent caching
export const useOptimizedPerfumes = () => {
  return useQuery({
    queryKey: ['perfumes-optimized'],
    queryFn: () => trackApiCall('perfumes', async () => {
      const { data, error } = await supabase
        .from('perfumes')
        .select(`
          *,
          perfume_prices (size_ml, price)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    }),
    ...CACHE_CONFIGS.perfumes,
    refetchOnWindowFocus: false
  });
};

// Batch queries for better performance
export const useBatchQueries = () => {
  const queryClient = useQueryClient();
  
  const prefetchCriticalData = async () => {
    const queries = [
      ['perfumes-optimized'],
      ['available-sizes'],
      ['material-configurations']
    ];
    
    await Promise.allSettled(
      queries.map(queryKey => 
        queryClient.prefetchQuery({
          queryKey,
          staleTime: CACHE_CONFIGS.perfumes.staleTime
        })
      )
    );
  };
  
  return { prefetchCriticalData };
};

// Smart cache invalidation
export const useSmartCacheInvalidation = () => {
  const queryClient = useQueryClient();
  
  const invalidateRelatedQueries = (entityType: string, entityId?: string) => {
    switch (entityType) {
      case 'perfume':
        queryClient.invalidateQueries({ queryKey: ['perfumes'] });
        queryClient.invalidateQueries({ queryKey: ['perfume-prices'] });
        if (entityId) {
          queryClient.invalidateQueries({ queryKey: ['perfume', entityId] });
        }
        break;
        
      case 'price':
        queryClient.invalidateQueries({ queryKey: ['perfume-prices'] });
        queryClient.invalidateQueries({ queryKey: ['available-sizes'] });
        break;
        
      case 'review':
        queryClient.invalidateQueries({ queryKey: ['reviews'] });
        if (entityId) {
          queryClient.invalidateQueries({ queryKey: ['perfume-reviews', entityId] });
        }
        break;
    }
    
    debugLog(`Cache invalidated for: ${entityType}`, { entityId });
  };
  
  return { invalidateRelatedQueries };
};

// Performance-optimized infinite queries
export const useOptimizedInfiniteQuery = <T>(
  baseQueryKey: string[],
  fetchFn: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options?: any
) => {
  return useInfiniteQuery({
    queryKey: baseQueryKey,
    queryFn: ({ pageParam }: { pageParam?: number }) => 
      performanceMonitor.trackOperation(
        `infinite_${baseQueryKey.join('_')}`,
        () => fetchFn(pageParam || 1),
        { page: pageParam }
      ),
    getNextPageParam: (lastPage: any) => 
      lastPage?.hasMore ? lastPage.nextPage || (lastPage as any).page + 1 : undefined,
    staleTime: CACHE_CONFIGS.perfumes.staleTime,
    gcTime: CACHE_CONFIGS.perfumes.gcTime,
    refetchOnWindowFocus: false,
    ...options
  });
};

// Background refresh strategy
export const useBackgroundRefresh = () => {
  const queryClient = useQueryClient();
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      // Refresh stale critical data in background
      queryClient.invalidateQueries({
        queryKey: ['perfumes-optimized'],
        refetchType: 'none' // Don't refetch if not mounted
      });
    }, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(interval);
  }, [queryClient]);
};

// Query statistics for monitoring
export const useQueryStats = () => {
  const queryClient = useQueryClient();
  
  const getStats = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const stats = {
      totalQueries: queries.length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      loadingQueries: queries.filter(q => q.state.status === 'pending').length,
      cacheSize: cache.getAll().reduce((acc, q) => 
        acc + JSON.stringify(q.state.data || {}).length, 0
      )
    };
    
    debugLog('Query Cache Stats:', stats);
    return stats;
  };
  
  return { getStats };
};