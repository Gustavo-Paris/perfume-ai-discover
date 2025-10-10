import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CouponMetric, CouponRoiData } from '@/types/marketingMetrics';

export const useCouponAnalytics = (dateRange?: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: ['coupon-analytics', dateRange],
    queryFn: async () => {
      let query = supabase.from('coupon_metrics').select('*');
      
      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []) as CouponMetric[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useTopCouponsByROI = (limit: number = 10) => {
  return useQuery({
    queryKey: ['top-coupons-roi', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupon_metrics')
        .select('*')
        .order('roi_percentage', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return (data || []).map(coupon => ({
        code: coupon.code,
        revenue: coupon.total_revenue || 0,
        discount: coupon.total_discount || 0,
        roi: coupon.roi_percentage || 0,
        orders: coupon.orders_completed || 0,
      })) as CouponRoiData[];
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useTopCouponsByRevenue = (limit: number = 10) => {
  return useQuery({
    queryKey: ['top-coupons-revenue', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupon_metrics')
        .select('*')
        .order('total_revenue', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return (data || []).map(coupon => ({
        code: coupon.code,
        revenue: coupon.total_revenue || 0,
        discount: coupon.total_discount || 0,
        roi: coupon.roi_percentage || 0,
        orders: coupon.orders_completed || 0,
      })) as CouponRoiData[];
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useTopCouponsByUsage = (limit: number = 10) => {
  return useQuery({
    queryKey: ['top-coupons-usage', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupon_metrics')
        .select('*')
        .order('orders_completed', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return (data || []).map(coupon => ({
        code: coupon.code,
        revenue: coupon.total_revenue || 0,
        discount: coupon.total_discount || 0,
        roi: coupon.roi_percentage || 0,
        orders: coupon.orders_completed || 0,
      })) as CouponRoiData[];
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useCouponConversionRates = () => {
  return useQuery({
    queryKey: ['coupon-conversion-rates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupon_metrics')
        .select('code, current_uses, orders_completed, orders_attempted, conversion_rate')
        .order('conversion_rate', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useCouponAbandonmentAnalysis = () => {
  return useQuery({
    queryKey: ['coupon-abandonment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupon_metrics')
        .select('code, orders_attempted, orders_completed')
        .order('orders_attempted', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(coupon => ({
        code: coupon.code,
        attempted: coupon.orders_attempted || 0,
        completed: coupon.orders_completed || 0,
        abandoned: (coupon.orders_attempted || 0) - (coupon.orders_completed || 0),
        abandonmentRate: coupon.orders_attempted > 0
          ? (((coupon.orders_attempted - coupon.orders_completed) / coupon.orders_attempted) * 100)
          : 0,
      }));
    },
    staleTime: 10 * 60 * 1000,
  });
};
