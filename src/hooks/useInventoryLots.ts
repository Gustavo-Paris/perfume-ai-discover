
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InventoryLot } from '@/types';

export const useInventoryLots = () => {
  return useQuery({
    queryKey: ['inventory-lots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_lots')
        .select(`
          *,
          perfumes(name, brand),
          warehouses(name, location)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateInventoryLot = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lot: Omit<InventoryLot, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('inventory_lots')
        .insert(lot)
        .select()
        .single();
      
      if (error) throw error;

      // Create initial stock movement for the purchase
      await supabase
        .from('stock_movements')
        .insert({
          perfume_id: lot.perfume_id,
          lot_id: data.id,
          change_ml: lot.qty_ml,
          movement_type: 'purchase',
          notes: `Lote inicial: ${lot.lot_code}`
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-lots'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });
};
