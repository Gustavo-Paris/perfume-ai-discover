export interface CouponMetric {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  current_uses: number;
  max_uses: number | null;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  orders_completed: number;
  orders_attempted: number;
  total_revenue: number;
  total_discount: number;
  roi_percentage: number;
  conversion_rate: number;
}

export interface CouponRoiData {
  code: string;
  revenue: number;
  discount: number;
  roi: number;
  orders: number;
}

export interface CouponUsageData {
  date: string;
  code: string;
  uses: number;
  revenue: number;
}

export interface MarketingMetrics {
  totalCouponsActive: number;
  totalDiscountGiven: number;
  totalRevenueFromCoupons: number;
  averageRoi: number;
  totalConversions: number;
  averageConversionRate: number;
}

export interface CouponTrend {
  month: string;
  coupons_used: number;
  total_discount: number;
  total_revenue: number;
  conversion_rate: number;
}

export interface NewCustomerAcquisition {
  code: string;
  new_customers: number;
  total_customers: number;
  cac: number; // Customer Acquisition Cost
  discount_given: number;
}
