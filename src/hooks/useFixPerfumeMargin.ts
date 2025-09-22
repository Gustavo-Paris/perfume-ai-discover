import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useFixPerfumeMargin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      perfumeId, 
      newMarginPercentage = 100 
    }: { 
      perfumeId: string; 
      newMarginPercentage?: number;
    }) => {
      console.log(`🔧 Corrigindo margem do perfume ${perfumeId} para ${newMarginPercentage}%`);
      
      // Converter porcentagem para multiplicador (100% = 2.0)
      const marginMultiplier = 1 + (newMarginPercentage / 100);
      
      const { data, error } = await supabase.rpc('fix_perfume_margin', {
        perfume_uuid: perfumeId,
        new_margin_percentage: marginMultiplier
      });
      
      if (error) {
        console.error('❌ Erro ao corrigir margem:', error);
        throw error;
      }
      
      console.log('✅ Margem corrigida com sucesso:', data);
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(
        `✅ Margem ajustada para ${variables.newMarginPercentage}%! Preços recalculados automaticamente.`
      );
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['price-integrity'] });
      queryClient.invalidateQueries({ queryKey: ['perfumes'] });
      queryClient.invalidateQueries({ queryKey: ['perfume-prices'] });
      queryClient.invalidateQueries({ queryKey: ['price-logs'] });
    },
    onError: (error: any) => {
      console.error('❌ Erro ao corrigir margem:', error);
      toast.error(`❌ Erro ao corrigir margem: ${error.message}`);
    },
  });
};