export interface OrdersOverview {
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  avg_order_value: number;
}

export interface OrdersByStatus {
  status: string;
  count: number;
  total_value: number;
  percentage: number;
}

export interface OrdersByPeriod {
  period: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  avg_order_value: number;
}

export interface TopCustomers {
  user_id: string;
  user_name: string;
  user_email: string;
  total_orders: number;
  total_spent: number;
  avg_order_value: number;
  last_order_date: string;
}

export interface OrderFulfillmentMetrics {
  avg_processing_time_hours: number;
  avg_delivery_time_days: number;
  on_time_delivery_rate: number;
  total_shipped: number;
  total_delivered: number;
}
