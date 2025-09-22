import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PriceLog {
  id: string;
  perfume_id: string;
  action_type: string;
  trigger_source: string;
  old_prices: any;
  new_prices: any;
  error_message: string | null;
  execution_time_ms: number | null;
  created_at: string;
  created_by: string | null;
}

export const usePriceLogs = (limit = 100) => {
  return useQuery({
    queryKey: ['price-logs', limit],
    queryFn: async (): Promise<PriceLog[]> => {
      const { data, error } = await supabase
        .from('price_calculation_logs')
        .select(`
          id,
          perfume_id,
          action_type,
          trigger_source,
          old_prices,
          new_prices,
          error_message,
          execution_time_ms,
          created_at,
          created_by
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Erro ao buscar logs de preços:', error);
        throw error;
      }
      
      return data || [];
    },
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });
};

export const usePerfumePriceLogs = (perfumeId: string, limit = 20) => {
  return useQuery({
    queryKey: ['price-logs', 'perfume', perfumeId, limit],
    queryFn: async (): Promise<PriceLog[]> => {
      const { data, error } = await supabase
        .from('price_calculation_logs')
        .select(`
          id,
          perfume_id,
          action_type,
          trigger_source,
          old_prices,
          new_prices,
          error_message,
          execution_time_ms,
          created_at,
          created_by
        `)
        .eq('perfume_id', perfumeId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Erro ao buscar logs do perfume:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!perfumeId,
  });
};