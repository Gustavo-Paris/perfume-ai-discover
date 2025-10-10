export interface ProductSalesData {
  perfume_id: string;
  name: string;
  brand: string;
  total_revenue: number;
  total_quantity: number;
  total_orders: number;
  avg_price: number;
  avg_margin: number;
  margin_percentage: number;
}

export interface CrossSellData {
  product_1_id: string;
  product_1_name: string;
  product_2_id: string;
  product_2_name: string;
  times_bought_together: number;
  correlation_score: number;
}

export interface ABCClassification {
  class: 'A' | 'B' | 'C';
  perfume_id: string;
  name: string;
  brand: string;
  revenue: number;
  revenue_percentage: number;
  cumulative_percentage: number;
}

export interface BCGMatrix {
  perfume_id: string;
  name: string;
  brand: string;
  revenue: number;
  margin: number;
  category: 'star' | 'cash_cow' | 'question_mark' | 'dog';
  growth_rate: number;
  market_share: number;
}

export interface ProductPerformance {
  perfume_id: string;
  name: string;
  brand: string;
  total_revenue: number;
  total_quantity: number;
  avg_margin_percentage: number;
  performance_score: number;
  trend: 'up' | 'down' | 'stable';
}
