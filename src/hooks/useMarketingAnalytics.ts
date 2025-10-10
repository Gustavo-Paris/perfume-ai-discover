import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  CouponPerformance, 
  CampaignMetrics, 
  TopCouponUser,
  CouponTypeAnalysis 
} from '@/types/marketingAnalytics';

export function useCouponPerformance(limit: number = 20) {
  return useQuery({
    queryKey: ['marketing-analytics', 'coupon-performance', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_coupon_performance', { p_limit: limit });
      
      if (error) throw error;
      return data as CouponPerformance[];
    },
  });
}

export function useCampaignMetrics(days: number = 30) {
  return useQuery({
    queryKey: ['marketing-analytics', 'campaign-metrics', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_campaign_metrics', { p_days: days });
      
      if (error) throw error;
      return data as CampaignMetrics[];
    },
  });
}

export function useTopCouponUsers(limit: number = 10) {
  return useQuery({
    queryKey: ['marketing-analytics', 'top-coupon-users', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_top_coupon_users', { p_limit: limit });
      
      if (error) throw error;
      return data as TopCouponUser[];
    },
  });
}

export function useCouponTypeAnalysis() {
  return useQuery({
    queryKey: ['marketing-analytics', 'coupon-type-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_coupon_type_analysis');
      
      if (error) throw error;
      return data as CouponTypeAnalysis[];
    },
  });
}

export function useActiveCoupons() {
  return useQuery({
    queryKey: ['marketing-analytics', 'active-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}
