import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRecalculateAllPrices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('🔄 Iniciando recálculo de todos os preços...');
      
      const { data, error } = await supabase.rpc('recalculate_all_prices');
      
      console.log('📊 Resposta do recalculate_all_prices:', { data, error });
      
      if (error) {
        console.error('❌ Erro ao recalcular todos os preços:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      console.log('✅ Recálculo concluído com sucesso:', data);
      
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
      console.error('❌ Erro no recálculo:', error);
      toast.error(`❌ Erro ao recalcular preços: ${error.message || 'Erro desconhecido'}`);
    },
  });
};