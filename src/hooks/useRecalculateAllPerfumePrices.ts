import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRecalculateAllPerfumePrices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newSizes: number[]) => {
      // First get all existing perfumes
      const { data: perfumes, error: perfumesError } = await supabase
        .from('perfumes')
        .select('id, name, brand');

      if (perfumesError) throw perfumesError;

      if (!perfumes || perfumes.length === 0) {
        return { updatedPerfumes: 0, newSizesAdded: newSizes.length };
      }

      // For each perfume, calculate prices for new sizes
      const updatePromises = perfumes.map(async (perfume) => {
        const sizePromises = newSizes.map(async (size) => {
          try {
            // Calculate cost for this perfume and size
            const { data: costData, error: costError } = await supabase.rpc('calculate_product_total_cost', {
              perfume_uuid: perfume.id,
              size_ml_param: size
            });

            if (costError) {
              console.warn(`Erro ao calcular custo para ${perfume.name} (${size}ml):`, costError);
              return null;
            }

            // Set the calculated price
            if (costData && costData.length > 0) {
              const { error: priceError } = await supabase.rpc('set_perfume_price', {
                perfume_uuid: perfume.id,
                size_ml_param: size,
                price_param: costData[0].suggested_price
              });

              if (priceError) {
                console.warn(`Erro ao definir preço para ${perfume.name} (${size}ml):`, priceError);
                return null;
              }

              return { perfumeId: perfume.id, size, price: costData[0].suggested_price };
            }

            return null;
          } catch (error) {
            console.warn(`Erro no perfume ${perfume.name} (${size}ml):`, error);
            return null;
          }
        });

        return Promise.all(sizePromises);
      });

      await Promise.all(updatePromises);

      return {
        updatedPerfumes: perfumes.length,
        newSizesAdded: newSizes.length
      };
    },
    onSuccess: (result) => {
      if (result.newSizesAdded > 0) {
        toast.success(
          `✅ Recálculo concluído! ${result.updatedPerfumes} perfumes atualizados com ${result.newSizesAdded} novo(s) tamanho(s).`
        );
      }
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['perfume-prices'] });
      queryClient.invalidateQueries({ queryKey: ['perfumes'] });
      queryClient.invalidateQueries({ queryKey: ['perfumes-with-costs'] });
      queryClient.invalidateQueries({ queryKey: ['available-sizes'] });
    },
    onError: (error) => {
      console.error('Erro ao recalcular preços:', error);
      toast.error('❌ Erro ao recalcular preços automaticamente');
    },
  });
};