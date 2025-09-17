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
      // Converter porcentagem para decimal (ex: 200 -> 2.0)
      const marginAsDecimal = newMarginPercentage / 100;
      
      console.log('Updating margin:', { 
        perfumeId, 
        originalPercentage: newMarginPercentage,
        marginAsDecimal 
      });
      
      const { data, error } = await supabase.rpc('update_perfume_margin', {
        perfume_uuid: perfumeId,
        new_margin_percentage: marginAsDecimal
      });

      if (error) {
        console.error('Error updating margin:', error);
        throw error;
      }

      console.log('Margin updated successfully'); 
      return data;
    },
    onSuccess: (_, { perfumeId }) => {
      console.log('Success callback, invalidating queries for perfume:', perfumeId); // Debug log
      
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