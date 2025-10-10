import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MarketingMetrics } from '@/types/marketingMetrics';
import { subMonths, format } from 'date-fns';

export const useMarketingMetrics = (dateRange?: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: ['marketing-metrics', dateRange],
    queryFn: async () => {
      // Get coupon metrics from the view
      let query = supabase.from('coupon_metrics').select('*');
      
      // Apply date filter if provided
      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }
      
      const { data: coupons, error } = await query;
      
      if (error) throw error;
      
      // Calculate aggregate metrics
      const metrics: MarketingMetrics = {
        totalCouponsActive: coupons?.filter(c => c.is_active).length || 0,
        totalDiscountGiven: coupons?.reduce((sum, c) => sum + (c.total_discount || 0), 0) || 0,
        totalRevenueFromCoupons: coupons?.reduce((sum, c) => sum + (c.total_revenue || 0), 0) || 0,
        averageRoi: coupons?.length 
          ? coupons.reduce((sum, c) => sum + (c.roi_percentage || 0), 0) / coupons.length 
          : 0,
        totalConversions: coupons?.reduce((sum, c) => sum + (c.orders_completed || 0), 0) || 0,
        averageConversionRate: coupons?.length
          ? coupons.reduce((sum, c) => sum + (c.conversion_rate || 0), 0) / coupons.length
          : 0,
      };
      
      return metrics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useMarketingTrends = (monthsBack: number = 6) => {
  return useQuery({
    queryKey: ['marketing-trends', monthsBack],
    queryFn: async () => {
      const startDate = subMonths(new Date(), monthsBack);
      
      // Get coupon redemptions over time
      const { data: redemptions, error } = await supabase
        .from('coupon_redemptions')
        .select(`
          created_at,
          discount_amount,
          code,
          order_id,
          orders (
            total_amount,
            payment_status
          )
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Group by month
      const monthlyData = new Map<string, {
        coupons_used: number;
        total_discount: number;
        total_revenue: number;
        total_attempts: number;
        successful: number;
      }>();
      
      redemptions?.forEach((redemption: any) => {
        const month = format(new Date(redemption.created_at), 'yyyy-MM');
        const isPaid = redemption.orders?.payment_status === 'paid';
        
        if (!monthlyData.has(month)) {
          monthlyData.set(month, {
            coupons_used: 0,
            total_discount: 0,
            total_revenue: 0,
            total_attempts: 0,
            successful: 0,
          });
        }
        
        const data = monthlyData.get(month)!;
        data.total_attempts++;
        
        if (isPaid) {
          data.coupons_used++;
          data.successful++;
          data.total_discount += redemption.discount_amount || 0;
          data.total_revenue += redemption.orders?.total_amount || 0;
        }
      });
      
      // Convert to array and calculate conversion rates
      return Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        coupons_used: data.coupons_used,
        total_discount: data.total_discount,
        total_revenue: data.total_revenue,
        conversion_rate: data.total_attempts > 0 
          ? (data.successful / data.total_attempts) * 100 
          : 0,
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCACByCoupon = () => {
  return useQuery({
    queryKey: ['cac-by-coupon'],
    queryFn: async () => {
      // Get all coupon redemptions with user info
      const { data: redemptions, error } = await supabase
        .from('coupon_redemptions')
        .select(`
          code,
          discount_amount,
          user_id,
          order_id,
          orders (
            payment_status,
            created_at
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Group by coupon code
      const couponData = new Map<string, {
        total_customers: Set<string>;
        new_customers: Set<string>;
        discount_given: number;
      }>();
      
      // Get all users' first order dates
      const { data: allOrders } = await supabase
        .from('orders')
        .select('user_id, created_at, payment_status')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: true });
      
      const firstOrderDates = new Map<string, Date>();
      allOrders?.forEach(order => {
        if (!firstOrderDates.has(order.user_id)) {
          firstOrderDates.set(order.user_id, new Date(order.created_at));
        }
      });
      
      // Process redemptions
      redemptions?.forEach((redemption: any) => {
        if (redemption.orders?.payment_status !== 'paid') return;
        
        const code = redemption.code;
        const userId = redemption.user_id;
        const orderDate = new Date(redemption.orders.created_at);
        const firstOrderDate = firstOrderDates.get(userId);
        
        if (!couponData.has(code)) {
          couponData.set(code, {
            total_customers: new Set(),
            new_customers: new Set(),
            discount_given: 0,
          });
        }
        
        const data = couponData.get(code)!;
        data.total_customers.add(userId);
        data.discount_given += redemption.discount_amount || 0;
        
        // Check if this is their first order (within 1 day tolerance)
        if (firstOrderDate) {
          const daysDiff = Math.abs(orderDate.getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysDiff < 1) {
            data.new_customers.add(userId);
          }
        }
      });
      
      // Calculate CAC for each coupon
      return Array.from(couponData.entries()).map(([code, data]) => ({
        code,
        new_customers: data.new_customers.size,
        total_customers: data.total_customers.size,
        cac: data.new_customers.size > 0 
          ? data.discount_given / data.new_customers.size 
          : 0,
        discount_given: data.discount_given,
      }));
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};
