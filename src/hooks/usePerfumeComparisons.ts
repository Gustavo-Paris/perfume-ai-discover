import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface PerfumeComparison {
  id: string;
  user_id?: string;
  name: string;
  perfume_ids: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  perfumes?: any[];
}

export interface CreateComparisonData {
  name?: string;
  perfume_ids: string[];
  notes?: string;
}

export interface UpdateComparisonData {
  id: string;
  name?: string;
  perfume_ids?: string[];
  notes?: string;
}

// Get user's comparisons
export const usePerfumeComparisons = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['perfume-comparisons', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfume_comparisons')
        .select('*')
        .eq('user_id', user?.id || null)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Buscar dados dos perfumes para cada comparação
      const comparisonsWithPerfumes = await Promise.all(
        (data || []).map(async (comparison) => {
          if (comparison.perfume_ids.length === 0) {
            return { ...comparison, perfumes: [] };
          }

          const { data: perfumes, error: perfumesError } = await supabase
            .from('perfumes')
            .select(`
              id,
              name,
              brand,
              image_url,
              price_full,
              price_5ml,
              price_10ml,
              family,
              gender,
              top_notes,
              heart_notes,
              base_notes,
              description
            `)
            .in('id', comparison.perfume_ids);

          if (perfumesError) {
            console.error('Error fetching perfumes for comparison:', perfumesError);
            return { ...comparison, perfumes: [] };
          }

          // Manter a ordem dos perfumes conforme perfume_ids
          const orderedPerfumes = comparison.perfume_ids
            .map(id => perfumes?.find(p => p.id === id))
            .filter(Boolean);

          return { ...comparison, perfumes: orderedPerfumes };
        })
      );

      return comparisonsWithPerfumes;
    },
    enabled: true, // Sempre habilitado para permitir comparações anônimas
  });
};

// Get single comparison
export const usePerfumeComparison = (comparisonId: string) => {
  return useQuery({
    queryKey: ['perfume-comparison', comparisonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfume_comparisons')
        .select('*')
        .eq('id', comparisonId)
        .single();

      if (error) throw error;

      if (data.perfume_ids.length === 0) {
        return { ...data, perfumes: [] };
      }

      const { data: perfumes, error: perfumesError } = await supabase
        .from('perfumes')
        .select(`
          id,
          name,
          brand,
          image_url,
          price_full,
          price_5ml,
          price_10ml,
          family,
          gender,
          top_notes,
          heart_notes,
          base_notes,
          description
        `)
        .in('id', data.perfume_ids);

      if (perfumesError) throw perfumesError;

      // Manter a ordem dos perfumes conforme perfume_ids
      const orderedPerfumes = data.perfume_ids
        .map(id => perfumes?.find(p => p.id === id))
        .filter(Boolean);

      return { ...data, perfumes: orderedPerfumes };
    },
    enabled: !!comparisonId,
  });
};

// Create comparison
export const useCreateComparison = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateComparisonData) => {
      if (data.perfume_ids.length < 2) {
        throw new Error('É necessário pelo menos 2 perfumes para comparar');
      }

      if (data.perfume_ids.length > 4) {
        throw new Error('Máximo de 4 perfumes por comparação');
      }

      const { data: result, error } = await supabase
        .from('perfume_comparisons')
        .insert({
          user_id: user?.id || null,
          name: data.name || 'Nova Comparação',
          perfume_ids: data.perfume_ids,
          notes: data.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfume-comparisons'] });
      toast({
        title: "Comparação criada! 🔍",
        description: "Sua comparação de perfumes foi salva",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar comparação",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });
};

// Update comparison
export const useUpdateComparison = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateComparisonData) => {
      const { id, ...updateData } = data;
      
      const { data: result, error } = await supabase
        .from('perfume_comparisons')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfume-comparisons'] });
      toast({
        title: "Comparação atualizada",
        description: "Suas alterações foram salvas",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar comparação",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });
};

// Delete comparison
export const useDeleteComparison = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comparisonId: string) => {
      const { error } = await supabase
        .from('perfume_comparisons')
        .delete()
        .eq('id', comparisonId);

      if (error) throw error;
      return comparisonId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfume-comparisons'] });
      toast({
        title: "Comparação removida",
        description: "A comparação foi excluída",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover comparação",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });
};

// Add perfume to comparison
export const useAddToComparison = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ comparisonId, perfumeId }: { comparisonId: string; perfumeId: string }) => {
      // Get current comparison
      const { data: comparison, error: fetchError } = await supabase
        .from('perfume_comparisons')
        .select('perfume_ids')
        .eq('id', comparisonId)
        .single();

      if (fetchError) throw fetchError;

      if (comparison.perfume_ids.includes(perfumeId)) {
        throw new Error('Este perfume já está na comparação');
      }

      if (comparison.perfume_ids.length >= 4) {
        throw new Error('Máximo de 4 perfumes por comparação');
      }

      const newPerfumeIds = [...comparison.perfume_ids, perfumeId];

      const { error } = await supabase
        .from('perfume_comparisons')
        .update({ perfume_ids: newPerfumeIds })
        .eq('id', comparisonId);

      if (error) throw error;
      return { comparisonId, perfumeId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfume-comparisons'] });
      queryClient.invalidateQueries({ queryKey: ['perfume-comparison'] });
      toast({
        title: "Perfume adicionado",
        description: "Perfume adicionado à comparação",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar perfume",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });
};

// Remove perfume from comparison
export const useRemoveFromComparison = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ comparisonId, perfumeId }: { comparisonId: string; perfumeId: string }) => {
      // Get current comparison
      const { data: comparison, error: fetchError } = await supabase
        .from('perfume_comparisons')
        .select('perfume_ids')
        .eq('id', comparisonId)
        .single();

      if (fetchError) throw fetchError;

      const newPerfumeIds = comparison.perfume_ids.filter(id => id !== perfumeId);

      if (newPerfumeIds.length < 2) {
        throw new Error('É necessário pelo menos 2 perfumes para manter a comparação');
      }

      const { error } = await supabase
        .from('perfume_comparisons')
        .update({ perfume_ids: newPerfumeIds })
        .eq('id', comparisonId);

      if (error) throw error;
      return { comparisonId, perfumeId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfume-comparisons'] });
      queryClient.invalidateQueries({ queryKey: ['perfume-comparison'] });
      toast({
        title: "Perfume removido",
        description: "Perfume removido da comparação",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover perfume",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });
};