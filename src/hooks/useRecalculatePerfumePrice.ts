import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRecalculatePerfumePrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ perfumeId, sizes }: { perfumeId: string; sizes: number[] }) => {
      const results = [];
      
      for (const size of sizes) {
        try {
          // Calculate cost for this perfume and size
          const { data: costData, error: costError } = await supabase.rpc('calculate_product_total_cost', {
            perfume_uuid: perfumeId,
            size_ml_param: size
          });

          if (costError) {
            console.error(`Erro ao calcular custo para (${size}ml):`, costError);
            results.push({ size, success: false, error: costError.message });
            continue;
          }

          // Set the calculated price
          if (costData && costData.length > 0) {
            const { error: priceError } = await supabase.rpc('set_perfume_price', {
              perfume_uuid: perfumeId,
              size_ml_param: size,
              price_param: costData[0].suggested_price
            });

            if (priceError) {
              console.error(`Erro ao definir preço para (${size}ml):`, priceError);
              results.push({ size, success: false, error: priceError.message });
              continue;
            }

            results.push({ 
              size, 
              success: true, 
              price: costData[0].suggested_price,
              cost: costData[0].total_cost_per_unit 
            });
          } else {
            results.push({ size, success: false, error: 'Sem dados de custo retornados' });
          }
        } catch (error) {
          console.error(`Erro no tamanho ${size}ml:`, error);
          results.push({ size, success: false, error: error.message });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      if (successful.length > 0) {
        toast.success(
          `✅ ${successful.length} tamanho(s) recalculado(s): ${successful.map(r => `${r.size}ml=R$${r.price?.toFixed(2)}`).join(', ')}`
        );
      }
      
      if (failed.length > 0) {
        toast.error(
          `❌ ${failed.length} erro(s): ${failed.map(r => `${r.size}ml: ${r.error}`).join(', ')}`
        );
      }
      
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['perfume-prices'] });
      queryClient.invalidateQueries({ queryKey: ['perfumes'] });
    },
    onError: (error) => {
      console.error('Erro ao recalcular preços do perfume:', error);
      toast.error('❌ Erro geral ao recalcular preços');
    },
  });
};