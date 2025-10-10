export interface RevenueMetrics {
  period: string;
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  total_cost: number;
  gross_profit: number;
  profit_margin: number;
}

export interface ExpenseCategory {
  category: string;
  total_amount: number;
  percentage_of_revenue: number;
  transaction_count: number;
}

export interface CashFlowData {
  period: string;
  cash_in: number;
  cash_out: number;
  net_cash_flow: number;
  cumulative_balance: number;
}

export interface PaymentMethodAnalysis {
  payment_method: string;
  total_transactions: number;
  total_amount: number;
  avg_transaction_value: number;
  percentage_of_total: number;
}

export interface ProfitByCategory {
  category: string;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  profit_margin: number;
  units_sold: number;
}

export interface MonthlyComparison {
  metric: string;
  current_month: number;
  previous_month: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'stable';
}
