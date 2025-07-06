import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

interface InfiniteScrollOptions<T> {
  queryKey: string[];
  queryFn: (params: { pageParam: number }) => Promise<{
    data: T[];
    nextPage?: number;
    hasMore: boolean;
  }>;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

export function useInfiniteScroll<T>({
  queryKey,
  queryFn,
  enabled = true,
  staleTime = 5 * 60 * 1000,
  gcTime = 10 * 60 * 1000,
}: InfiniteScrollOptions<T>) {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime,
    gcTime,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: 1,
  });

  // Flatten all pages into single array
  const flatData = useMemo(() => {
    return data?.pages.flatMap(page => page.data) ?? [];
  }, [data]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return {
    data: flatData,
    error,
    loadMore,
    hasNextPage,
    isLoading: status === 'pending',
    isFetching,
    isFetchingNextPage,
    isEmpty: flatData.length === 0 && status === 'success',
  };
}

// Specialized hook for perfumes with infinite scroll
export function useInfinitePerfumes(filters?: any) {
  return useInfiniteScroll({
    queryKey: ['perfumes-infinite', filters],
    queryFn: async ({ pageParam }) => {
      const limit = 12;
      const from = (pageParam - 1) * limit;
      const to = from + limit - 1;

      const { supabase } = await import('@/integrations/supabase/client');
      
      let query = supabase
        .from('perfumes')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply filters
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`);
      }
      if (filters?.brands?.length > 0) {
        query = query.in('brand', filters.brands);
      }
      if (filters?.genders?.length > 0) {
        query = query.in('gender', filters.genders);
      }
      if (filters?.families?.length > 0) {
        query = query.in('family', filters.families);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: data || [],
        nextPage: pageParam + 1,
        hasMore: (count || 0) > to + 1,
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}