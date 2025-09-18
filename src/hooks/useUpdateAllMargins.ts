import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { percentageToMultiplier } from '@/utils/marginHelpers';

export const useUpdateAllMargins = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (marginPercentage: number) => {
      // Converter porcentagem para multiplicador (ex: 80% = 1.8)
      const marginMultiplier = percentageToMultiplier(marginPercentage);
      
      console.log(`Atualizando todas as margens para ${marginPercentage}% (multiplicador: ${marginMultiplier})`);

      // Buscar todos os perfumes
      const { data: perfumes, error: perfumesError } = await supabase
        .from('perfumes')
        .select('id, name, brand');

      if (perfumesError) throw perfumesError;

      if (!perfumes || perfumes.length === 0) {
        return { updatedPerfumes: 0 };
      }

      // Atualizar margem de todos os perfumes
      const { error: updateError } = await supabase
        .from('perfumes')
        .update({ target_margin_percentage: marginMultiplier })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

      if (updateError) throw updateError;

      // Recalcular todos os preços
      const { error: recalcError } = await supabase.rpc('recalculate_all_perfume_prices');
      
      if (recalcError) {
        console.warn('Erro ao recalcular preços automaticamente:', recalcError);
      }

      return {
        updatedPerfumes: perfumes.length,
        marginPercentage,
        marginMultiplier
      };
    },
    onSuccess: (result) => {
      toast.success(
        `✅ ${result.updatedPerfumes} perfumes atualizados com margem de ${result.marginPercentage}%! Preços recalculados automaticamente.`
      );
      
      // Invalidar todas as queries relevantes
      queryClient.invalidateQueries({ queryKey: ['perfumes'] });
      queryClient.invalidateQueries({ queryKey: ['perfumes-with-costs'] });
      queryClient.invalidateQueries({ queryKey: ['perfume-prices'] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar margens:', error);
      toast.error('❌ Erro ao atualizar margens em massa');
    },
  });
};