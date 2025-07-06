import { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Prefetch related data to improve UX
export const prefetchRelatedData = {
  // Prefetch perfume details when hovering over perfume card
  perfumeDetails: async (queryClient: QueryClient, perfumeId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['reviews', perfumeId, 1, 5],
      queryFn: async () => {
        // Batch fetch reviews and profiles
        const [reviewsResult, profilesResult] = await Promise.all([
          supabase
            .from('reviews')
            .select('*', { count: 'exact' })
            .eq('perfume_id', perfumeId)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .range(0, 4),
          
          supabase
            .from('reviews')
            .select('user_id')
            .eq('perfume_id', perfumeId)
            .eq('status', 'approved')
            .range(0, 4)
        ]);

        if (reviewsResult.error) throw reviewsResult.error;
        if (profilesResult.error) throw profilesResult.error;

        const reviews = reviewsResult.data || [];
        const userIds = [...new Set(profilesResult.data?.map(r => r.user_id) || [])];

        let profilesMap = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', userIds);

          profilesMap = (profiles || []).reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>);
        }

        const reviewsWithProfiles = reviews.map(review => ({
          ...review,
          user: profilesMap[review.user_id] ? {
            name: profilesMap[review.user_id].name,
            email: profilesMap[review.user_id].email
          } : undefined
        }));

        return {
          reviews: reviewsWithProfiles,
          total: reviewsResult.count || 0,
          hasMore: (reviewsResult.count || 0) > 5
        };
      },
      staleTime: 5 * 60 * 1000,
    });

    // Also prefetch review stats
    await queryClient.prefetchQuery({
      queryKey: ['review-stats', perfumeId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('reviews')
          .select('rating')
          .eq('perfume_id', perfumeId)
          .eq('status', 'approved');

        if (error) throw error;

        const reviews = data || [];
        const total = reviews.length;
        
        if (total === 0) {
          return {
            total: 0,
            average: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          };
        }

        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        const average = sum / total;

        const distribution = reviews.reduce((acc, review) => {
          acc[review.rating] = (acc[review.rating] || 0) + 1;
          return acc;
        }, {} as { [key: number]: number });

        for (let i = 1; i <= 5; i++) {
          if (!distribution[i]) distribution[i] = 0;
        }

        return {
          total,
          average: Math.round(average * 10) / 10,
          distribution
        };
      },
      staleTime: 5 * 60 * 1000,
    });
  },

  // Prefetch user profile when showing reviews
  userProfile: async (queryClient: QueryClient, userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['profile', userId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', userId)
          .single();

        if (error) throw error;
        return data;
      },
      staleTime: 15 * 60 * 1000, // Profiles don't change often
    });
  },

  // Prefetch next page of data for infinite scroll
  nextPage: async (queryClient: QueryClient, queryKey: string[], nextPageParam: number) => {
    const [baseKey, ...params] = queryKey;
    
    await queryClient.prefetchQuery({
      queryKey: [baseKey, ...params, nextPageParam],
      queryFn: async () => {
        // This would be the same function used in the infinite query
        // Implementation depends on the specific data being prefetched
      },
      staleTime: 5 * 60 * 1000,
    });
  }
};

// Cache warming function to prefetch commonly accessed data
export const warmCache = async (queryClient: QueryClient) => {
  // Prefetch most popular perfumes
  await queryClient.prefetchQuery({
    queryKey: ['perfumes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfumes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    staleTime: 15 * 60 * 1000,
  });

  // Prefetch user's cart if authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await queryClient.prefetchQuery({
      queryKey: ['cart', user.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('cart_items')
          .select(`
            *,
            perfumes (*)
          `)
          .eq('user_id', user.id);

        if (error) throw error;
        return data;
      },
      staleTime: 2 * 60 * 1000, // Cart data is more volatile
    });
  }
};