import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DatabasePerfume } from '@/types';
import { debugLog, debugError } from '@/utils/removeDebugLogs';

// Hook otimizado que substitui usePerfumes com melhor cache e performance
export const usePerfumesOptimized = () => {
  return useQuery({
    queryKey: ['perfumes-optimized'],
    queryFn: async (): Promise<DatabasePerfume[]> => {
      debugLog('🚀 Fetching optimized perfumes...');
      
      const startTime = performance.now();
      
      const { data: perfumes, error } = await supabase
        .from('perfumes')
        .select('*')
        .order('created_at', { ascending: false }); // More logical order
      
      const endTime = performance.now();
      debugLog(`✅ Perfumes loaded in ${endTime - startTime}ms`, { count: perfumes?.length });

      if (error) {
        debugError('❌ Error fetching perfumes:', error);
        throw error;
      }

      return perfumes?.map(perfume => ({
        ...perfume,
        gender: perfume.gender as 'masculino' | 'feminino' | 'unissex',
        product_type: perfume.product_type as 'decant' | 'miniature' | 'both' | null,
        available_sizes: perfume.available_sizes as number[] | null,
        top_notes: perfume.top_notes as string[] | null,
        heart_notes: perfume.heart_notes as string[] | null,
        base_notes: perfume.base_notes as string[] | null,
      })) || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - perfumes não mudam frequentemente
    gcTime: 15 * 60 * 1000, // 15 minutos em cache
    refetchOnWindowFocus: false, // Evitar refetch desnecessário
    refetchOnMount: false, // Usar cache quando possível
  });
};

// Hook especializado para buscar apenas perfumes com preços
export const usePerfumesWithValidPrices = () => {
  return useQuery({
    queryKey: ['perfumes-with-valid-prices'],
    queryFn: async () => {
      debugLog('🚀 Fetching perfumes with valid prices...');
      
      const { data: perfumes, error } = await supabase
        .from('perfumes')
        .select(`
          *,
          perfume_prices!inner (
            size_ml,
            price
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        debugError('❌ Error fetching perfumes with prices:', error);
        throw error;
      }

      debugLog(`✅ Found ${perfumes?.length} perfumes with prices`);
      return perfumes || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,
  });
};

// Hook para admin que precisa de dados mais atualizados
export const usePerfumesAdmin = () => {
  return useQuery({
    queryKey: ['perfumes-admin'],
    queryFn: async (): Promise<DatabasePerfume[]> => {
      debugLog('👨‍💼 Fetching admin perfumes...');
      
      const { data: perfumes, error } = await supabase
        .from('perfumes')
        .select('*')
        .order('brand', { ascending: true }) // Para admin, ordenar por marca é melhor
        .order('name', { ascending: true });

      if (error) {
        debugError('❌ Admin perfumes error:', error);
        throw error;
      }

      // Debug dos primeiros perfumes para verificar campos de preço
      if (perfumes && perfumes.length > 0) {
        debugLog('🔍 Primeiro perfume retornado:', {
          name: perfumes[0].name,
          price_2ml: perfumes[0].price_2ml,
          price_5ml: perfumes[0].price_5ml,
          price_10ml: perfumes[0].price_10ml,
          price_full: perfumes[0].price_full,
          target_margin_percentage: perfumes[0].target_margin_percentage
        });
      }

      return perfumes?.map(perfume => ({
        ...perfume,
        gender: perfume.gender as 'masculino' | 'feminino' | 'unissex',
        product_type: perfume.product_type as 'decant' | 'miniature' | 'both' | null,
        available_sizes: perfume.available_sizes as number[] | null,
        top_notes: perfume.top_notes as string[] | null,
        heart_notes: perfume.heart_notes as string[] | null,
        base_notes: perfume.base_notes as string[] | null,
      })) || [];
    },
    staleTime: 2 * 60 * 1000, // Admin precisa de dados mais frescos
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};