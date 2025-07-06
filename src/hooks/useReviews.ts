import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Review, ReviewStats } from '@/types/review';

export const useReviews = (perfumeId: string, page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['reviews', perfumeId, page, limit],
    queryFn: async () => {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Fix N+1 query: Use separate queries but batch them
      const [reviewsResult, profilesResult] = await Promise.all([
        supabase
          .from('reviews')
          .select('*', { count: 'exact' })
          .eq('perfume_id', perfumeId)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .range(from, to),
        
        // Get all user IDs first, then batch fetch profiles
        supabase
          .from('reviews')
          .select('user_id')
          .eq('perfume_id', perfumeId)
          .eq('status', 'approved')
          .range(from, to)
      ]);

      if (reviewsResult.error) throw reviewsResult.error;
      if (profilesResult.error) throw profilesResult.error;

      const reviews = reviewsResult.data || [];
      const userIds = [...new Set(profilesResult.data?.map(r => r.user_id) || [])];

      // Batch fetch profiles for all users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      const profilesMap = (profiles || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>);

      // Combine reviews with profiles
      const reviewsWithProfiles: Review[] = reviews.map(review => ({
        ...review,
        user: profilesMap[review.user_id] ? {
          name: profilesMap[review.user_id].name,
          email: profilesMap[review.user_id].email
        } : undefined
      })) as Review[];

      return {
        reviews: reviewsWithProfiles,
        total: reviewsResult.count || 0,
        hasMore: (reviewsResult.count || 0) > to + 1
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  });
};

export const useReviewStats = (perfumeId: string) => {
  return useQuery({
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

      // Ensure all ratings 1-5 are represented
      for (let i = 1; i <= 5; i++) {
        if (!distribution[i]) distribution[i] = 0;
      }

      return {
        total,
        average: Math.round(average * 10) / 10,
        distribution
      } as ReviewStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
  });
};

export const useUserReview = (perfumeId: string) => {
  return useQuery({
    queryKey: ['user-review', perfumeId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('perfume_id', perfumeId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data as Review | null;
    },
    enabled: !!perfumeId,
  });
};

export const useCanReview = (perfumeId: string) => {
  return useQuery({
    queryKey: ['can-review', perfumeId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .rpc('user_has_purchased_perfume', {
          user_uuid: user.id,
          perfume_uuid: perfumeId
        });

      if (error) throw error;
      
      return data as boolean;
    },
    enabled: !!perfumeId,
  });
};