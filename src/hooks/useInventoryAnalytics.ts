import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  InventoryOverview,
  StockLevels,
  StockMovements,
  InventoryTurnover,
  LotExpiration
} from '@/types/inventoryAnalytics';

export function useInventoryOverview() {
  return useQuery({
    queryKey: ['inventory-analytics', 'overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_inventory_overview');
      
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) as InventoryOverview;
    },
  });
}

export function useStockLevels() {
  return useQuery({
    queryKey: ['inventory-analytics', 'stock-levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_stock_levels');
      
      if (error) throw error;
      return data as StockLevels[];
    },
  });
}

export function useStockMovements(days: number = 30) {
  return useQuery({
    queryKey: ['inventory-analytics', 'movements', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_stock_movements', { p_days: days });
      
      if (error) throw error;
      return data as StockMovements[];
    },
  });
}

export function useInventoryTurnover(days: number = 90) {
  return useQuery({
    queryKey: ['inventory-analytics', 'turnover', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_inventory_turnover', { p_days: days });
      
      if (error) throw error;
      return data as InventoryTurnover[];
    },
  });
}

export function useLotExpirations() {
  return useQuery({
    queryKey: ['inventory-analytics', 'lot-expirations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_lot_expirations');
      
      if (error) throw error;
      return data as LotExpiration[];
    },
  });
}
