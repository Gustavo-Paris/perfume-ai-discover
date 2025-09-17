import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UpdateMarginParams {
  perfumeId: string;
  newMarginPercentage: number;
}

export const useUpdatePerfumeMargin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ perfumeId, newMarginPercentage }: UpdateMarginParams) => {
      // PADRÃO: newMarginPercentage deve vir como decimal (ex: 2.0 para 200%)
      console.log('Updating margin:', { perfumeId, newMarginPercentage }); 
      
      const { data, error } = await supabase.rpc('update_perfume_margin', {
        perfume_uuid: perfumeId,
        new_margin_percentage: newMarginPercentage // Envia direto como decimal
      });

      if (error) {
        console.error('Error updating margin:', error);
        throw error;
      }

      console.log('Margin updated successfully:', data);
      return data;
    },
    onSuccess: (_, { perfumeId }) => {
      console.log('Success callback, invalidating queries for perfume:', perfumeId);
      
      toast.success('Margem atualizada! Preços recalculados automaticamente.');
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['perfumes'] });
      queryClient.invalidateQueries({ queryKey: ['perfumes-with-costs'] });
      queryClient.invalidateQueries({ queryKey: ['perfume-prices'] });
      queryClient.invalidateQueries({ queryKey: ['perfume-prices', perfumeId] });
    },
    onError: (error) => {
      console.error('Failed to update margin:', error);
      toast.error('Erro ao atualizar margem de lucro');
    },
  });
};