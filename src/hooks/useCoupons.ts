import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Coupon, CouponRedemption, CouponValidationResult } from '@/types/coupon';
import { toast } from '@/hooks/use-toast';

export const useCoupons = () => {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Coupon[];
    },
  });
};

export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: async ({ code, orderTotal }: { code: string; orderTotal: number }) => {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { code, orderTotal }
      });

      if (error) throw error;
      return data as CouponValidationResult;
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao validar cupom",
        description: error.message || "Não foi possível validar o cupom",
        variant: "destructive",
      });
    },
  });
};

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (couponData: Omit<Coupon, 'current_uses' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('coupons')
        .insert(couponData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({
        title: "Cupom criado",
        description: "Cupom criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar cupom",
        description: error.message || "Não foi possível criar o cupom",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, updates }: { code: string; updates: Partial<Coupon> }) => {
      const { data, error } = await supabase
        .from('coupons')
        .update(updates)
        .eq('code', code)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({
        title: "Cupom atualizado",
        description: "Cupom atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar cupom",
        description: error.message || "Não foi possível atualizar o cupom",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('code', code);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({
        title: "Cupom excluído",
        description: "Cupom excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir cupom",
        description: error.message || "Não foi possível excluir o cupom",
        variant: "destructive",
      });
    },
  });
};

export const useCouponRedemptions = () => {
  return useQuery({
    queryKey: ['coupon-redemptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupon_redemptions')
        .select(`
          *,
          coupons (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CouponRedemption[];
    },
  });
};