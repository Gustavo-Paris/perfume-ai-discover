import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useFixPerfumeMargin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      perfumeId, 
      newMarginPercentage = 2.0 
    }: { 
      perfumeId: string; 
      newMarginPercentage?: number; 
    }): Promise<boolean> => {
      console.log('🔧 Corrigindo margem do perfume:', perfumeId, 'Nova margem:', newMarginPercentage);
      
      const { data, error } = await supabase.rpc('fix_perfume_margin', {
        perfume_uuid: perfumeId,
        new_margin_percentage: newMarginPercentage
      });
      
      if (error) {
        console.error('❌ Erro ao corrigir margem:', error);
        throw error;
      }
      
      console.log('✅ Margem corrigida com sucesso:', data);
      return data;
    },
    onSuccess: (result, variables) => {
      const marginPercent = ((variables.newMarginPercentage || 2.0) - 1) * 100;
      toast.success(
        `✅ Margem corrigida! Nova margem: ${marginPercent.toFixed(0)}% - Preços recalculados automaticamente`
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