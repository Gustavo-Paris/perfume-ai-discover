import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReviewModerationResult {
  approved: boolean;
  reason: string;
  confidence: number;
  tags: string[];
}

export interface ReviewWithModeration {
  id: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_id: string;
  perfume_id: string;
  moderation_result?: ReviewModerationResult;
  moderated_at?: string;
  user?: {
    name: string;
    email: string;
  };
  perfume?: {
    name: string;
    brand: string;
  };
}

// Get pending reviews for moderation
export const usePendingReviews = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['pending-reviews', page, limit],
    queryFn: async () => {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_user_id_fkey (name, email),
          perfumes!reviews_perfume_id_fkey (name, brand)
        `, { count: 'exact' })
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .range(from, to);

      if (error) throw error;

      const reviews: ReviewWithModeration[] = (data || []).map(review => ({
        ...review,
        status: review.status as 'pending' | 'approved' | 'rejected',
        user: review.profiles && typeof review.profiles === 'object' && 'name' in review.profiles ? {
          name: review.profiles.name,
          email: review.profiles.email
        } : undefined,
        perfume: review.perfumes ? {
          name: review.perfumes.name,
          brand: review.perfumes.brand
        } : undefined
      }));

      return {
        reviews,
        total: count || 0,
        hasMore: (count || 0) > to + 1
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - pending reviews change frequently
  });
};

// Auto-moderate review using AI
export const useAutoModerateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, comment, rating }: {
      reviewId: string;
      comment: string;
      rating: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('moderate-review', {
        body: { reviewId, comment, rating }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};

// Bulk moderate reviews
export const useBulkModerateReviews = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewIds, action }: {
      reviewIds: string[];
      action: 'approve' | 'reject';
    }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update({ 
          status: action === 'approve' ? 'approved' : 'rejected',
          moderated_at: new Date().toISOString()
        })
        .in('id', reviewIds)
        .select();

      if (error) throw error;

      // Send notifications for approved reviews
      if (action === 'approve') {
        const notifications = data.map(review => ({
          user_id: review.user_id,
          type: 'review_approved',
          message: 'Sua avaliação foi aprovada!',
          metadata: {
            review_id: review.id,
            perfume_id: review.perfume_id
          }
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};

// Get review moderation stats
export const useReviewModerationStats = () => {
  return useQuery({
    queryKey: ['review-moderation-stats'],
    queryFn: async () => {
      const [pendingResult, approvedResult, rejectedResult] = await Promise.all([
        supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved'),
        supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'rejected')
      ]);

      return {
        pending: pendingResult.count || 0,
        approved: approvedResult.count || 0,
        rejected: rejectedResult.count || 0,
        total: (pendingResult.count || 0) + (approvedResult.count || 0) + (rejectedResult.count || 0)
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Advanced filters for reviews
export const useReviewsWithFilters = (filters: {
  status?: string[];
  rating?: number[];
  dateRange?: [Date, Date];
  perfumeId?: string;
  userId?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['reviews-filtered', filters],
    queryFn: async () => {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_user_id_fkey (name, email),
          perfumes!reviews_perfume_id_fkey (name, brand)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply filters
      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters.rating?.length) {
        query = query.in('rating', filters.rating);
      }
      if (filters.perfumeId) {
        query = query.eq('perfume_id', filters.perfumeId);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.dateRange) {
        query = query.gte('created_at', filters.dateRange[0].toISOString())
                   .lte('created_at', filters.dateRange[1].toISOString());
      }

      const { data, error, count } = await query;
      if (error) throw error;

      // Filter by moderation tags if specified
      let filteredData = data || [];
      if (filters.tags?.length) {
        filteredData = filteredData.filter(review => {
          const moderationTags = (review as any).moderation_result?.tags || [];
          return filters.tags?.some(tag => moderationTags.includes(tag));
        });
      }

      const reviews: ReviewWithModeration[] = filteredData.map(review => ({
        ...review,
        status: review.status as 'pending' | 'approved' | 'rejected',
        user: review.profiles && typeof review.profiles === 'object' && 'name' in review.profiles ? {
          name: review.profiles.name,
          email: review.profiles.email
        } : undefined,
        perfume: review.perfumes ? {
          name: review.perfumes.name,
          brand: review.perfumes.brand
        } : undefined
      }));

      return {
        reviews,
        total: count || 0,
        hasMore: (count || 0) > to + 1
      };
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};