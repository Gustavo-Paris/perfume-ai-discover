import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdvancedCoupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  coupon_category: string;
  applicable_categories: string[];
  free_shipping: boolean;
  first_purchase_only: boolean;
  minimum_quantity: number | null;
  maximum_discount_amount: number | null;
  usage_per_user: number | null;
  auto_apply: boolean;
  stackable: boolean;
  min_order_value: number;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  discount_amount?: number;
  final_total?: number;
  free_shipping?: boolean;
  coupon_type?: string;
  coupon_value?: number;
}

export const useAdvancedCoupons = () => {
  const [loading, setLoading] = useState(false);

  const validateCoupon = useCallback(async (
    couponCode: string,
    orderTotal: number,
    cartItems: any[] = []
  ): Promise<CouponValidationResult> => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user?.user?.id;

      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .rpc('validate_coupon_advanced', {
          coupon_code: couponCode,
          order_total: orderTotal,
          user_uuid: userId,
          cart_items: cartItems
        });

      if (error) {
        console.error('Validation error:', error);
        return { valid: false, error: 'Erro ao validar cupom' };
      }

      return (data as any) as CouponValidationResult;
    } catch (error) {
      console.error('Error validating coupon:', error);
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Erro ao validar cupom' 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const applyCoupon = useCallback(async (
    couponCode: string,
    orderId: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .rpc('apply_coupon_to_order', {
          coupon_code: couponCode,
          order_uuid: orderId
        });

      if (error) {
        console.error('Apply coupon error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error applying coupon:', error);
      return false;
    }
  }, []);

  const getAutoApplicableCoupons = useCallback(async (
    orderTotal: number,
    cartItems: any[] = []
  ): Promise<AdvancedCoupon[]> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user?.user?.id;

      if (!userId) return [];

      // Buscar cupons auto-aplicáveis
      const { data: coupons, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .eq('auto_apply', true)
        .lte('min_order_value', orderTotal);

      if (error || !coupons) return [];

      const applicableCoupons: AdvancedCoupon[] = [];

      // Validar cada cupom
      for (const coupon of coupons) {
        const validation = await validateCoupon(coupon.code, orderTotal, cartItems);
        if (validation.valid) {
          applicableCoupons.push(coupon as AdvancedCoupon);
        }
      }

      return applicableCoupons;
    } catch (error) {
      console.error('Error getting auto-applicable coupons:', error);
      return [];
    }
  }, [validateCoupon]);

  const createFirstPurchaseCoupon = useCallback(async (
    userEmail: string
  ): Promise<string | null> => {
    try {
      const couponCode = `BEMVINDO${Date.now().toString().slice(-6)}`;
      
      const { error } = await supabase
        .from('coupons')
        .insert({
          code: couponCode,
          type: 'percent',
          value: 15,
          coupon_category: 'first_purchase',
          first_purchase_only: true,
          usage_per_user: 1,
          max_uses: 1,
          min_order_value: 50,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
          is_active: true
        });

      if (error) {
        console.error('Error creating first purchase coupon:', error);
        return null;
      }

      return couponCode;
    } catch (error) {
      console.error('Error creating first purchase coupon:', error);
      return null;
    }
  }, []);

  const createFreeShippingCoupon = useCallback(async (
    minOrderValue: number = 199
  ): Promise<string | null> => {
    try {
      const couponCode = `FRETEGRATIS${Date.now().toString().slice(-6)}`;
      
      const { error } = await supabase
        .from('coupons')
        .insert({
          code: couponCode,
          type: 'fixed',
          value: 0,
          coupon_category: 'shipping',
          free_shipping: true,
          min_order_value: minOrderValue,
          max_uses: 100,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
          is_active: true
        });

      if (error) {
        console.error('Error creating free shipping coupon:', error);
        return null;
      }

      return couponCode;
    } catch (error) {
      console.error('Error creating free shipping coupon:', error);
      return null;
    }
  }, []);

  return {
    validateCoupon,
    applyCoupon,
    getAutoApplicableCoupons,
    createFirstPurchaseCoupon,
    createFreeShippingCoupon,
    loading
  };
};