import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  RevenueMetrics,
  ExpenseCategory,
  CashFlowData,
  PaymentMethodAnalysis,
  ProfitByCategory,
  MonthlyComparison
} from '@/types/financialAnalytics';

export function useRevenueMetrics(days: number = 30) {
  return useQuery({
    queryKey: ['financial-analytics', 'revenue-metrics', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_revenue_metrics', { p_days: days });
      
      if (error) throw error;
      return data as RevenueMetrics[];
    },
  });
}

export function useExpenseCategories(days: number = 30) {
  return useQuery({
    queryKey: ['financial-analytics', 'expense-categories', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_expense_categories', { p_days: days });
      
      if (error) throw error;
      return data as ExpenseCategory[];
    },
  });
}

export function useCashFlowAnalysis(days: number = 90) {
  return useQuery({
    queryKey: ['financial-analytics', 'cash-flow', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_cash_flow_analysis', { p_days: days });
      
      if (error) throw error;
      return data as CashFlowData[];
    },
  });
}

export function usePaymentMethodAnalysis(days: number = 30) {
  return useQuery({
    queryKey: ['financial-analytics', 'payment-methods', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_payment_method_analysis', { p_days: days });
      
      if (error) throw error;
      return data as PaymentMethodAnalysis[];
    },
  });
}

export function useProfitByCategory(days: number = 30) {
  return useQuery({
    queryKey: ['financial-analytics', 'profit-by-category', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_profit_by_category', { p_days: days });
      
      if (error) throw error;
      return data as ProfitByCategory[];
    },
  });
}

export function useMonthlyComparison() {
  return useQuery({
    queryKey: ['financial-analytics', 'monthly-comparison'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_monthly_comparison');
      
      if (error) throw error;
      return data as MonthlyComparison[];
    },
  });
}
