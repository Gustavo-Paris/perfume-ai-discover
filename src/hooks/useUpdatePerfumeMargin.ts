import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UpdateMarginParams {
  perfumeId: string;
  newMarginPercentage: number;
}

interface UpdateMarginResponse {
  success: boolean;
  perfume_id: string;
  new_margin: number;
  updated_sizes: number[];
  message: string;
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
      
      // Cast the response to our interface (safe cast through unknown)
      const response = data as unknown as UpdateMarginResponse;
      
      // Check if the update was successful
      if (response && response.success) {
        console.log('Updated sizes:', response.updated_sizes);
        return response;
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