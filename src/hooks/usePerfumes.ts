
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DatabasePerfume } from '@/types';

export const usePerfumes = () => {
  return useQuery({
    queryKey: ['perfumes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfumes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DatabasePerfume[];
    },
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
