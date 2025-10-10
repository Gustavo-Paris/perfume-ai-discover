import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  OrdersOverview,
  OrdersByStatus,
  OrdersByPeriod,
  TopCustomers,
  OrderFulfillmentMetrics
} from '@/types/ordersAnalytics';

export function useOrdersOverview(days: number = 30) {
  return useQuery({
    queryKey: ['orders-analytics', 'overview', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_orders_overview', { p_days: days });
      
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) as OrdersOverview;
    },
  });
}

export function useOrdersByStatus(days: number = 30) {
  return useQuery({
    queryKey: ['orders-analytics', 'by-status', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_orders_by_status', { p_days: days });
      
      if (error) throw error;
      return data as OrdersByStatus[];
    },
  });
}

export function useOrdersByPeriod(days: number = 30) {
  return useQuery({
    queryKey: ['orders-analytics', 'by-period', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_orders_by_period', { p_days: days });
      
      if (error) throw error;
      return data as OrdersByPeriod[];
    },
  });
}

export function useTopCustomers(limit: number = 10) {
  return useQuery({
    queryKey: ['orders-analytics', 'top-customers', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_top_customers', { p_limit: limit });
      
      if (error) throw error;
      return data as TopCustomers[];
    },
  });
}

export function useOrderFulfillmentMetrics(days: number = 30) {
  return useQuery({
    queryKey: ['orders-analytics', 'fulfillment', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_order_fulfillment_metrics', { p_days: days });
      
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) as OrderFulfillmentMetrics;
    },
  });
}
