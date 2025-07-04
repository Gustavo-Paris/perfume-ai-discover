import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReviewForm } from '@/types/review';
import { toast } from '@/hooks/use-toast';

export const useCreateReview = (perfumeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewData: ReviewForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          perfume_id: perfumeId,
          user_id: user.id,
          rating: reviewData.rating,
          comment: reviewData.comment || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['reviews', perfumeId] });
      queryClient.invalidateQueries({ queryKey: ['review-stats', perfumeId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', perfumeId] });
      
      toast({
        title: "Avaliação enviada!",
        description: "Sua avaliação foi enviada e está aguardando aprovação.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar avaliação",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateReview = (perfumeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, reviewData }: { reviewId: string; reviewData: ReviewForm }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update({
          rating: reviewData.rating,
          comment: reviewData.comment || null,
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', perfumeId] });
      queryClient.invalidateQueries({ queryKey: ['review-stats', perfumeId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', perfumeId] });
      
      toast({
        title: "Avaliação atualizada!",
        description: "Sua avaliação foi atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar avaliação",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });
};