import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { trackOrderCompleted } from '@/utils/analytics';
import { useAuth } from '@/contexts/AuthContext';

export const useOrderTracking = () => {
  const { user } = useAuth();

  // Track when orders become paid
  const { data: orders } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (orders && orders.length > 0) {
      // Track the most recent paid order if it hasn't been tracked yet
      const latestOrder = orders[0];
      const trackedOrderId = localStorage.getItem('last_tracked_order');
      
      if (latestOrder.id !== trackedOrderId) {
        trackOrderCompleted(
          latestOrder.order_number,
          latestOrder.total_amount
        );
        localStorage.setItem('last_tracked_order', latestOrder.id);
      }
    }
  }, [orders]);
};