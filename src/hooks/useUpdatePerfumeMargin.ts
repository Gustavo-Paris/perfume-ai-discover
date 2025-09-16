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
      const { data, error } = await supabase.rpc('update_perfume_margin', {
        perfume_uuid: perfumeId,
        new_margin_percentage: newMarginPercentage
      });

      if (error) {
        console.error('Error updating margin:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Margem atualizada! Preços recalculados automaticamente.');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['perfumes'] });
      queryClient.invalidateQueries({ queryKey: ['perfumes-with-costs'] });
    },
    onError: (error) => {
      console.error('Failed to update margin:', error);
      toast.error('Erro ao atualizar margem de lucro');
    },
  });
};