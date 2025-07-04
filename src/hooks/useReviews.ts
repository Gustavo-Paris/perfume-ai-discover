import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Review, ReviewStats } from '@/types/review';

export const useReviews = (perfumeId: string, page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['reviews', perfumeId, page, limit],
    queryFn: async () => {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from('reviews')
        .select('*')
        .eq('perfume_id', perfumeId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Get user data for each review
      const reviews: Review[] = [];
      if (data) {
        for (const review of data) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', review.user_id)
            .single();

          reviews.push({
            ...review,
            user: profile ? {
              name: profile.name,
              email: profile.email
            } : undefined
          } as Review);
        }
      }

      return {
        reviews,
        total: count || 0,
        hasMore: (count || 0) > to + 1
      };
    },
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