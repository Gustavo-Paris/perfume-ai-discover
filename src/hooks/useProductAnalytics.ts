import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  ProductSalesData, 
  CrossSellData, 
  ABCClassification, 
  BCGMatrix,
  ProductPerformance 
} from '@/types/productAnalytics';

// Top produtos por receita
export const useTopProductsByRevenue = (limit: number = 20) => {
  return useQuery({
    queryKey: ['top-products-revenue', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top_products_by_revenue', {
        p_limit: limit
      });

      if (error) throw error;
      return data as ProductSalesData[];
    }
  });
};

// Top produtos por quantidade
export const useTopProductsByQuantity = (limit: number = 20) => {
  return useQuery({
    queryKey: ['top-products-quantity', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top_products_by_quantity', {
        p_limit: limit
      });

      if (error) throw error;
      return data as ProductSalesData[];
    }
  });
};

// Produtos com melhor margem
export const useTopProductsByMargin = (limit: number = 20) => {
  return useQuery({
    queryKey: ['top-products-margin', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top_products_by_margin', {
        p_limit: limit
      });

      if (error) throw error;
      return data as ProductSalesData[];
    }
  });
};

// Análise de Cross-sell
export const useCrossSellAnalysis = (limit: number = 20) => {
  return useQuery({
    queryKey: ['cross-sell-analysis', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cross_sell_products', {
        p_limit: limit
      });

      if (error) throw error;
      return data as CrossSellData[];
    }
  });
};

// Análise ABC
export const useABCAnalysis = () => {
  return useQuery({
    queryKey: ['abc-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_abc_classification');

      if (error) throw error;
      return data as ABCClassification[];
    }
  });
};

// Matriz BCG
export const useBCGMatrix = () => {
  return useQuery({
    queryKey: ['bcg-matrix'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_bcg_matrix');

      if (error) throw error;
      return data as BCGMatrix[];
    }
  });
};

// Performance geral de produtos
export const useProductPerformance = () => {
  return useQuery({
    queryKey: ['product-performance'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_product_performance');

      if (error) throw error;
      return data as ProductPerformance[];
    }
  });
};

// Produtos "mortos" (sem vendas)
export const useDeadProducts = (days: number = 60) => {
  return useQuery({
    queryKey: ['dead-products', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dead_products', {
        p_days: days
      });

      if (error) throw error;
      return data as ProductSalesData[];
    }
  });
};
