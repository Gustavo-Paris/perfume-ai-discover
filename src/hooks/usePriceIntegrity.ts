import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PriceIntegrityIssue {
  perfume_id: string;
  perfume_name: string;
  brand: string;
  issue_type: string;
  current_prices: any;
  suggested_action: string;
}

interface AutoFixResult {
  fixed_count: number;
  error_count: number;
  execution_time_ms: number;
  timestamp: string;
}

export const usePriceIntegrity = () => {
  return useQuery({
    queryKey: ['price-integrity'],
    queryFn: async (): Promise<PriceIntegrityIssue[]> => {
      const { data, error } = await supabase.rpc('check_price_integrity');
      
      if (error) {
        console.error('Erro ao verificar integridade dos preços:', error);
        throw error;
      }
      
      return data || [];
    },
    refetchInterval: 30000, // Verificar a cada 30 segundos
  });
};

export const useAutoFixPrices = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (): Promise<AutoFixResult> => {
      console.log('🔧 Iniciando correção automática dos preços...');
      
      const { data, error } = await supabase.rpc('auto_fix_perfume_prices');
      
      if (error) {
        console.error('❌ Erro na correção automática:', error);
        throw error;
      }
      
      console.log('✅ Correção automática concluída:', data);
      return data as unknown as AutoFixResult;
    },
    onSuccess: (result) => {
      if (result.fixed_count > 0) {
        toast.success(
          `✅ Correção automática concluída! ${result.fixed_count} perfume(s) corrigido(s) em ${result.execution_time_ms.toFixed(0)}ms`
        );
      } else {
        toast.success('✅ Todos os preços estão corretos!');
      }
      
      if (result.error_count > 0) {
        toast.error(
          `⚠️ ${result.error_count} erro(s) durante a correção. Verifique os logs para mais detalhes.`
        );
      }
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['price-integrity'] });
      queryClient.invalidateQueries({ queryKey: ['perfumes'] });
      queryClient.invalidateQueries({ queryKey: ['perfume-prices'] });
      queryClient.invalidateQueries({ queryKey: ['price-logs'] });
    },
    onError: (error: any) => {
      console.error('❌ Erro na correção automática:', error);
      toast.error(`❌ Erro na correção automática: ${error.message}`);
    },
  });
};

export const useDailyIntegrityCheck = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('daily_price_integrity_check');
      
      if (error) {
        console.error('❌ Erro na verificação diária:', error);
        throw error;
      }
      
      return data as any;
    },
    onSuccess: (result: any) => {
      if (result?.integrity_issues_found > 0) {
        toast.warning(
          `⚠️ Verificação diária: ${result.integrity_issues_found} problema(s) detectado(s) e ${result.auto_fix_executed ? 'correção automática executada' : 'nenhuma correção executada'}`
        );
      } else {
        toast.success('✅ Verificação diária: Todos os preços estão corretos!');
      }
      
      queryClient.invalidateQueries({ queryKey: ['price-integrity'] });
      queryClient.invalidateQueries({ queryKey: ['price-logs'] });
    },
    onError: (error: any) => {
      console.error('❌ Erro na verificação diária:', error);
      toast.error(`❌ Erro na verificação diária: ${error.message}`);
    },
  });
};