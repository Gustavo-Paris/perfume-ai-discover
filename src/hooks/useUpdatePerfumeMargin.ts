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
      // PADRÃO: newMarginPercentage deve vir como multiplicador (ex: 1.8 para 80% markup, 2.0 para 100% markup)
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
      
      // Check if the update was successful
      if (data && data.length > 0 && data[0].success) {
        console.log('Updated prices:', data[0].updated_prices);
        return data[0];
      } else {
        throw new Error('Failed to update margin - perfume not found or no changes made');
      }
    },
    onSuccess: (_, { perfumeId }) => {
      console.log('Success callback, invalidating queries for perfume:', perfumeId);
      
      toast.success('Margem atualizada! Preços recalculados automaticamente.');
      
      // Invalidate all relevant queries with more specific targeting
      queryClient.invalidateQueries({ queryKey: ['perfumes'] });
      queryClient.invalidateQueries({ queryKey: ['perfumes-with-costs'] });
      queryClient.invalidateQueries({ queryKey: ['perfume-prices'] });
      queryClient.invalidateQueries({ queryKey: ['perfume-prices', perfumeId] });
      
      // Force refetch of the specific perfume prices
      queryClient.refetchQueries({ queryKey: ['perfume-prices', perfumeId] });
      
      console.log('All queries invalidated and refetched');
    },
    onError: (error) => {
      console.error('Failed to update margin:', error);
      toast.error('Erro ao atualizar margem de lucro');
    },
  });
};