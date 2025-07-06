import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Promotion {
  id: string;
  perfume_id: string;
  title: string;
  description?: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  original_price_5ml?: number;
  original_price_10ml?: number;
  original_price_full?: number;
  promotional_price_5ml?: number;
  promotional_price_10ml?: number;
  promotional_price_full?: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  perfumes?: {
    name: string;
    brand: string;
    image_url?: string;
  };
}

// Hook para buscar promoções ativas
export const useActivePromotions = () => {
  return useQuery({
    queryKey: ['promotions', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select(`
          *,
          perfumes (
            name,
            brand,
            image_url
          )
        `)
        .eq('is_active', true)
        .gte('ends_at', new Date().toISOString())
        .lte('starts_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active promotions:', error);
        throw error;
      }

      return data as Promotion[];
    }
  });
};

// Hook para buscar promoção ativa de um perfume específico
export const useActivePromotionByPerfume = (perfumeId: string) => {
  return useQuery({
    queryKey: ['promotions', 'perfume', perfumeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_active_promotion', { perfume_uuid: perfumeId });

      if (error) {
        console.error('Error fetching promotion for perfume:', error);
        throw error;
      }

      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!perfumeId
  });
};

// Hook para criar promoção (admin apenas)
export const useCreatePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (promotionData: Omit<Promotion, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('promotions')
        .insert(promotionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast({
        title: "Promoção criada!",
        description: "A promoção foi criada com sucesso e os usuários serão notificados.",
      });
    },
    onError: (error) => {
      console.error('Error creating promotion:', error);
      toast({
        title: "Erro ao criar promoção",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  });
};

// Hook para atualizar promoção (admin apenas)
export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Promotion> & { id: string }) => {
      const { data, error } = await supabase
        .from('promotions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast({
        title: "Promoção atualizada!",
        description: "A promoção foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating promotion:', error);
      toast({
        title: "Erro ao atualizar promoção",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  });
};

// Hook para deletar promoção (admin apenas)
export const useDeletePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (promotionId: string) => {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', promotionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast({
        title: "Promoção removida!",
        description: "A promoção foi removida com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting promotion:', error);
      toast({
        title: "Erro ao remover promoção",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  });
};

// Função utilitária para calcular preço promocional
export const calculatePromotionalPrice = (
  originalPrice: number,
  discountType: 'percent' | 'fixed',
  discountValue: number
): number => {
  if (discountType === 'percent') {
    return originalPrice * (1 - discountValue / 100);
  } else {
    return Math.max(0, originalPrice - discountValue);
  }
};

// Função utilitária para formatar desconto
export const formatDiscount = (discountType: 'percent' | 'fixed', discountValue: number): string => {
  if (discountType === 'percent') {
    return `${discountValue}% OFF`;
  } else {
    return `R$ ${discountValue.toFixed(2)} OFF`;
  }
};