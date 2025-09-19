import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DatabasePerfume } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

// Hook to check if user is admin
const useAdminCheck = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
        
        setIsAdmin(!!data);
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user]);

  return { isAdmin, loading };
};

// Optimized hook to fetch perfume with aggregated review stats
export const usePerfumeWithReviews = (perfumeId: string) => {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  
  return useQuery({
    queryKey: ['perfume-with-reviews', perfumeId, isAdmin],
    queryFn: async () => {
      // Batch fetch perfume and review stats
      let perfumeQuery;
      
      if (isAdmin) {
        // Admin users get full access including sensitive business data
        perfumeQuery = supabase
          .from('perfumes')
          .select('*')
          .eq('id', perfumeId)
          .single();
      } else {
        // Non-admin users get public data only (no sensitive business data)
        perfumeQuery = supabase
          .from('perfumes_public' as any)
          .select('*')
          .eq('id', perfumeId)
          .single();
      }
      
      const [perfumeResult, statsResult] = await Promise.all([
        perfumeQuery,
        supabase
          .from('reviews')
          .select('rating')
          .eq('perfume_id', perfumeId)
          .eq('status', 'approved')
      ]);

      if (perfumeResult.error) throw perfumeResult.error;
      if (statsResult.error) throw statsResult.error;
      
      const reviews = statsResult.data || [];
      const total = reviews.length;
      const average = total > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / total : 0;
      
      return {
        perfume: perfumeResult.data as DatabasePerfume,
        reviewStats: {
          total,
          average: Math.round(average * 10) / 10,
          distribution: reviews.reduce((acc, r) => {
            acc[r.rating] = (acc[r.rating] || 0) + 1;
            return acc;
          }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
        }
      };
    },
    enabled: !!perfumeId && !adminLoading,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 20 * 60 * 1000, // 20 minutes garbage collection
  });
};

// Batch fetch multiple perfumes with their stats
export const usePerfumesWithReviews = (perfumeIds: string[]) => {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  
  return useQuery({
    queryKey: ['perfumes-with-reviews', perfumeIds.sort(), isAdmin],
    queryFn: async () => {
      if (perfumeIds.length === 0) return [];

      // Batch query to get all perfumes and their review stats
      let perfumesQuery;
      
      if (isAdmin) {
        // Admin users get full access including sensitive business data
        perfumesQuery = supabase
          .from('perfumes')
          .select('*')
          .in('id', perfumeIds);
      } else {
        // Non-admin users get public data only (no sensitive business data)
        perfumesQuery = supabase
          .from('perfumes_public' as any)
          .select('*')
          .in('id', perfumeIds);
      }
      
      const { data: perfumes, error: perfumesError } = await perfumesQuery;

      if (perfumesError) throw perfumesError;

      // Get review stats for all perfumes in single query
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('perfume_id, rating')
        .in('perfume_id', perfumeIds)
        .eq('status', 'approved');

      if (reviewsError) throw reviewsError;

      // Group reviews by perfume_id
      const reviewsByPerfume = (reviews || []).reduce((acc, review) => {
        if (!acc[review.perfume_id]) acc[review.perfume_id] = [];
        acc[review.perfume_id].push(review);
        return acc;
      }, {} as Record<string, any[]>);

      // Combine perfumes with their stats
      return (perfumes || []).map(perfume => {
        const perfumeReviews = reviewsByPerfume[perfume.id] || [];
        const total = perfumeReviews.length;
        const average = total > 0 ? perfumeReviews.reduce((acc, r) => acc + r.rating, 0) / total : 0;

        return {
          perfume,
          reviewStats: {
            total,
            average: Math.round(average * 10) / 10,
            distribution: perfumeReviews.reduce((acc, r) => {
              acc[r.rating] = (acc[r.rating] || 0) + 1;
              return acc;
            }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
          }
        };
      });
    },
    enabled: perfumeIds.length > 0 && !adminLoading,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 20 * 60 * 1000, // 20 minutes garbage collection
  });
};