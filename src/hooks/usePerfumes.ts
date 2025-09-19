
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DatabasePerfume } from '@/types';
import { usePerfumeRealTimeUpdates } from './usePerfumeRealTime';

export const usePerfumes = () => {
  // Ativar atualizações em tempo real
  usePerfumeRealTimeUpdates();
  
  return useQuery({
    queryKey: ['perfumes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfumes')
        .select('*, target_margin_percentage, avg_cost_per_ml')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (DatabasePerfume & { target_margin_percentage?: number; avg_cost_per_ml?: number })[];
    },
    staleTime: 5 * 60 * 1000, // Reduzido para 5 minutos por causa das mudanças de preço
    gcTime: 10 * 60 * 1000, // Reduzido para 10 minutos
    refetchOnWindowFocus: true, // Reativado para pegar mudanças de preço
  });
};

// Extended perfume type with cost fields
export interface PerfumeWithCosts extends DatabasePerfume {
  avg_cost_per_ml?: number;
  target_margin_percentage?: number;
  last_cost_calculation?: string;
}

export const usePerfumesWithCosts = () => {
  return useQuery({
    queryKey: ['perfumes-with-costs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfumes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PerfumeWithCosts[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache for cost data
    refetchOnWindowFocus: false,
  });
};

export const useCreatePerfume = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (perfume: Omit<DatabasePerfume, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('perfumes')
        .insert(perfume)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfumes'] });
    },
  });
};

export const useUpdatePerfume = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DatabasePerfume> & { id: string }) => {
      const { data, error } = await supabase
        .from('perfumes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfumes'] });
    },
  });
};

export const useDeletePerfume = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('perfumes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfumes'] });
    },
  });
};
