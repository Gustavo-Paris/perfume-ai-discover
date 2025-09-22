import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DatabasePerfume } from '@/types';

export interface PerfumeWithPrices extends DatabasePerfume {
  dynamicPrices: Record<number, number>;
  availableSizes: number[];
}

// Hook otimizado que busca perfumes + preços em uma única query
export const usePerfumesWithPricesOptimized = () => {
  return useQuery({
    queryKey: ['perfumes-with-prices-optimized'],
    queryFn: async (): Promise<PerfumeWithPrices[]> => {
      // 1. Buscar todos os perfumes
      const { data: perfumes, error: perfumesError } = await supabase
        .from('perfumes')
        .select('*')
        .order('brand', { ascending: true });

      if (perfumesError) throw perfumesError;

      // 2. Buscar TODOS os preços de uma vez (mais eficiente)
      const { data: allPrices, error: pricesError } = await supabase
        .from('perfume_prices')
        .select('perfume_id, size_ml, price');

      if (pricesError) throw pricesError;

      // 3. Buscar configurações de tamanhos disponíveis
      const { data: materialConfig } = await supabase
        .from('material_configurations')
        .select('bottle_materials')
        .single();

      const bottleMaterials = materialConfig?.bottle_materials as any[];
      const defaultSizes = bottleMaterials?.map((b: any) => b.size_ml).sort((a: number, b: number) => a - b) || [2, 5, 10];

      // 4. Organizar preços por perfume (O(n) ao invés de O(n²))
      const pricesByPerfume: Record<string, Record<number, number>> = {};
      allPrices?.forEach(price => {
        if (!pricesByPerfume[price.perfume_id]) {
          pricesByPerfume[price.perfume_id] = {};
        }
        pricesByPerfume[price.perfume_id][price.size_ml] = price.price;
      });

      // 5. Combinar perfumes com preços
      return perfumes.map(perfume => ({
        ...perfume,
        gender: perfume.gender as 'masculino' | 'feminino' | 'unissex',
        dynamicPrices: pricesByPerfume[perfume.id] || {},
        availableSizes: defaultSizes
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - dados de preço não mudam muito
    gcTime: 10 * 60 * 1000, // 10 minutos em cache
  });
};