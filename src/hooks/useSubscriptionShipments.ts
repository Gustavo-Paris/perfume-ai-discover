import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionShipment, ShipmentStatus } from '@/types/subscription';

interface SubscriptionShipmentFilters {
  status?: ShipmentStatus;
  subscriptionId?: string;
}

interface ShipmentWithDetails extends SubscriptionShipment {
  subscription: {
    id: string;
    user_id: string;
    plan_id: string;
    status: string;
    plan: {
      id: string;
      name: string;
      decants_per_month: number;
      size_ml: number;
    };
  };
  perfumes: Array<{
    id: string;
    name: string;
    brand: string;
    image_url: string | null;
  }>;
}

export const useSubscriptionShipments = (filters?: SubscriptionShipmentFilters) => {
  return useQuery({
    queryKey: ['subscription-shipments', filters],
    queryFn: async () => {
      let query = supabase
        .from('subscription_shipments')
        .select(`
          *,
          subscription:user_subscriptions!inner(
            id,
            user_id,
            plan_id,
            status,
            plan:subscription_plans(
              id,
              name,
              decants_per_month,
              size_ml
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.subscriptionId) {
        query = query.eq('subscription_id', filters.subscriptionId);
      }

      const { data: shipments, error } = await query;

      if (error) throw error;

      // Buscar detalhes dos perfumes para cada envio
      const shipmentsWithPerfumes = await Promise.all(
        (shipments || []).map(async (shipment) => {
          if (!shipment.perfume_ids || shipment.perfume_ids.length === 0) {
            return {
              ...shipment,
              perfumes: []
            };
          }

          const { data: perfumes } = await supabase
            .from('perfumes')
            .select('id, name, brand, image_url')
            .in('id', shipment.perfume_ids);

          return {
            ...shipment,
            perfumes: perfumes || []
          };
        })
      );

      return shipmentsWithPerfumes as ShipmentWithDetails[];
    }
  });
};
