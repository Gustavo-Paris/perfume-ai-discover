
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StockMovement } from '@/types';

export const useStockMovements = (perfumeId?: string) => {
  return useQuery({
    queryKey: ['stock-movements', perfumeId],
    queryFn: async () => {
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          perfumes(name, brand),
          inventory_lots(lot_code)
        `)
        .order('created_at', { ascending: false });
      
      if (perfumeId) {
        query = query.eq('perfume_id', perfumeId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateStockMovement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (movement: Omit<StockMovement, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('stock_movements')
        .insert(movement)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-lots'] });
    },
  });
};
