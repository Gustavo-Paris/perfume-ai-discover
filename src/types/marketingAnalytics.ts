export interface CouponPerformance {
  coupon_id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  total_uses: number;
  total_revenue: number;
  total_discount_given: number;
  avg_order_value: number;
  conversion_rate: number;
  roi: number;
  created_at: string;
  expires_at: string | null;
}

export interface CampaignMetrics {
  period: string;
  total_orders: number;
  orders_with_coupon: number;
  coupon_usage_rate: number;
  total_revenue: number;
  revenue_with_coupon: number;
  total_discount_given: number;
  avg_discount_per_order: number;
  net_revenue: number;
}

export interface TopCouponUser {
  user_id: string;
  user_email: string;
  user_name: string | null;
  total_uses: number;
  total_saved: number;
  total_spent: number;
  avg_order_value: number;
  first_use: string;
  last_use: string;
}

export interface CouponTypeAnalysis {
  type: 'percent' | 'fixed' | 'free_shipping';
  total_coupons: number;
  active_coupons: number;
  total_uses: number;
  total_revenue: number;
  total_discount: number;
  avg_conversion_rate: number;
  roi: number;
}
