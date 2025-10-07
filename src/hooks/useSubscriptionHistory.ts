import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionShipment } from '@/types/subscription';

export const useSubscriptionHistory = (subscriptionId?: string) => {
  return useQuery({
    queryKey: ['subscription-history', subscriptionId],
    queryFn: async () => {
      if (!subscriptionId) return [];

      const { data, error } = await supabase
        .from('subscription_shipments')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('month_year', { ascending: false })
        .limit(12); // Últimos 12 meses

      if (error) throw error;
      return data as SubscriptionShipment[];
    },
    enabled: !!subscriptionId
  });
};
