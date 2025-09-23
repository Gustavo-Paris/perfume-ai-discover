import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useMaterialMovements = (materialId?: string) => {
  return useQuery({
    queryKey: ['material-movements', materialId],
    queryFn: async () => {
      let query = supabase
        .from('material_movements')
        .select(`
          *,
          materials(name, category, unit),
          material_lots(lot_code)
        `)
        .order('created_at', { ascending: false });
      
      if (materialId && materialId !== 'all') {
        query = query.eq('material_id', materialId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });
};