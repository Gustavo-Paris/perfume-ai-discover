import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DatabasePerfume } from '@/types';

export interface PerfumeWithPrices {
  id: string;
  name: string;
  brand: string;
  family: string;
  gender: 'masculino' | 'feminino' | 'unissex';
  description?: string | null;
  image_url?: string | null;
  top_notes?: string[] | null;
  heart_notes?: string[] | null;
  base_notes?: string[] | null;
  category?: string | null;
  product_type?: 'decant' | 'miniature' | 'both' | null;
  source_size_ml?: number | null;
  available_sizes?: number[] | null;
  price_2ml?: number | null;
  price_5ml?: number | null;
  price_10ml?: number | null;
  price_full?: number | null;
  avg_cost_per_ml?: number | null;
  target_margin_percentage?: number | null;
  created_at: string;
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

      // 5. Combinar perfumes com preços (cast types para evitar erros TypeScript)
      return perfumes.map(perfume => ({
        ...perfume,
        gender: perfume.gender as 'masculino' | 'feminino' | 'unissex',
        product_type: perfume.product_type as 'decant' | 'miniature' | 'both' | null,
        available_sizes: perfume.available_sizes as number[] | null,
        top_notes: perfume.top_notes as string[] | null,
        heart_notes: perfume.heart_notes as string[] | null,
        base_notes: perfume.base_notes as string[] | null,
        dynamicPrices: pricesByPerfume[perfume.id] || {},
        availableSizes: defaultSizes
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - dados de preço não mudam muito
    gcTime: 10 * 60 * 1000, // 10 minutos em cache
  });
};