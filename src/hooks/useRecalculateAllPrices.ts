import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRecalculateAllPrices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('recalculate_all_perfume_prices');
      
      if (error) {
        console.error('Erro ao recalcular todos os preços:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data && typeof data === 'object' && (data as any)?.message) {
        toast.success(
          `✅ ${(data as any).message}`
        );
      } else {
        toast.success('✅ Todos os preços foram recalculados com sucesso');
      }
      
      // Invalidar todas as queries de preços e perfumes
      queryClient.invalidateQueries({ queryKey: ['perfume-prices'] });
      queryClient.invalidateQueries({ queryKey: ['perfumes'] });
      queryClient.invalidateQueries({ queryKey: ['perfumes-with-costs'] });
    },
    onError: (error) => {
      console.error('Erro ao recalcular todos os preços:', error);
      toast.error('❌ Erro ao recalcular preços. Verifique o console.');
    },
  });
};