export interface Coupon {
  code: string;
  type: 'percent' | 'value';
  value: number;
  max_uses?: number;
  current_uses: number;
  min_order_value: number;
  expires_at?: string;
  created_at: string;
  is_active: boolean;
}

export interface CouponRedemption {
  id: string;
  code: string;
  order_id: string;
  user_id: string;
  discount_amount: number;
  created_at: string;
  // Joined data
  coupon?: Coupon;
  order?: {
    order_number: string;
  };
}

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  discount_amount?: number;
  final_total?: number;
  coupon_type?: 'percent' | 'value';
  coupon_value?: number;
}