import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PerfumePrice {
  id: string;
  perfume_id: string;
  size_ml: number;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface DynamicPerfumePrices {
  [size: number]: number;
}

// Hook para buscar preços dinâmicos de um perfume
export const usePerfumePrices = (perfumeId?: string) => {
  return useQuery({
    queryKey: ['perfume-prices', perfumeId],
    queryFn: async () => {
      if (!perfumeId) return [];
      
      const { data, error } = await supabase
        .from('perfume_prices')
        .select('*')
        .eq('perfume_id', perfumeId)
        .order('size_ml');
      
      if (error) throw error;
      return data as PerfumePrice[];
    },
    enabled: !!perfumeId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook para definir preços dinâmicos
export const useSetPerfumePrices = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ perfumeId, prices }: { perfumeId: string; prices: DynamicPerfumePrices }) => {
      const updates = await Promise.all(
        Object.entries(prices).map(async ([sizeMl, price]) => {
          const { data, error } = await supabase.rpc('set_perfume_price', {
            perfume_uuid: perfumeId,
            size_ml_param: parseInt(sizeMl),
            price_param: price
          });
          
          if (error) throw error;
          return data;
        })
      );
      
      return updates;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['perfume-prices', variables.perfumeId] });
      queryClient.invalidateQueries({ queryKey: ['perfumes'] });
      queryClient.invalidateQueries({ queryKey: ['perfumes-with-costs'] });
      toast.success('Preços atualizados com sucesso!');
    },
    onError: (error) => {
      console.error('Error setting prices:', error);
      toast.error('Erro ao atualizar preços');
    },
  });
};

// Hook para calcular preços dinamicamente com base nos materiais
export const useCalculateDynamicPrices = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ perfumeId, sizes }: { perfumeId: string; sizes: number[] }) => {
      const { data, error } = await supabase.rpc('calculate_dynamic_product_costs', {
        perfume_uuid: perfumeId,
        sizes_array: sizes
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['perfume-prices'] });
    },
    onError: (error) => {
      console.error('Error calculating prices:', error);
      toast.error('Erro ao calcular preços');
    },
  });
};

// Hook utilitário para converter array de preços em objeto
export const usePerfumePricesObject = (perfumeId?: string) => {
  const { data: prices, ...rest } = usePerfumePrices(perfumeId);
  const { data: allSizes } = useAvailableSizes();
  
  // Get perfume-specific available sizes
  const { data: perfumeData } = useQuery({
    queryKey: ['perfume-details', perfumeId],
    queryFn: async () => {
      if (!perfumeId) return null;
      try {
        const { data, error } = await supabase
          .from('perfumes')
          .select('available_sizes, product_type, source_size_ml')
          .eq('id', perfumeId)
          .single();
          
        if (error) {
          console.warn('Could not fetch perfume details:', error);
          return null;
        }
        return data;
      } catch (error) {
        console.warn('Error fetching perfume details:', error);
        return null;
      }
    },
    enabled: !!perfumeId,
    staleTime: 10 * 60 * 1000,
  });
  
  const pricesObject = prices?.reduce((acc, price) => {
    acc[price.size_ml] = price.price;
    return acc;
  }, {} as DynamicPerfumePrices) || {};
  
  // Use perfume-specific available_sizes if available, otherwise use global configuration
  const availableSizes = (perfumeData && 
                         'available_sizes' in perfumeData && 
                         perfumeData.available_sizes && 
                         Array.isArray(perfumeData.available_sizes) && 
                         perfumeData.available_sizes.length > 0)
    ? (perfumeData.available_sizes as number[]).sort((a: number, b: number) => a - b)
    : allSizes || [];
  
  return {
    prices: pricesObject,
    availableSizes,
    pricesArray: prices || [],
    ...rest
  };
};

// Hook para obter tamanhos disponíveis das configurações
export const useAvailableSizes = () => {
  return useQuery({
    queryKey: ['available-sizes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_configurations')
        .select('bottle_materials')
        .single();
      
      if (error) {
        console.warn('No material configurations found, using defaults');
        return [2, 5, 10]; // Fallback padrão
      }
      
      const bottleMaterials = data?.bottle_materials as any[];
      if (!bottleMaterials || bottleMaterials.length === 0) {
        return [2, 5, 10]; // Fallback padrão
      }
      
      return bottleMaterials.map(bm => bm.size_ml).sort((a, b) => a - b);
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - configurations don't change often
    refetchOnWindowFocus: false,
  });
};