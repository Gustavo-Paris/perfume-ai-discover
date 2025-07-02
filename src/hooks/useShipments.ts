
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shipment, BuyLabelRequest, BuyLabelResponse } from '@/types/shipment';

export const useShipments = (orderId?: string) => {
  return useQuery({
    queryKey: ['shipments', orderId],
    queryFn: async () => {
      const query = supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (orderId) {
        query.eq('order_id', orderId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Shipment[];
    },
    enabled: !!orderId
  });
};

export const useBuyLabel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: BuyLabelRequest): Promise<BuyLabelResponse> => {
      const { data, error } = await supabase.functions.invoke('me-buy-label', {
        body: request
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Erro ao comprar etiqueta');
      
      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch shipments
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
};
