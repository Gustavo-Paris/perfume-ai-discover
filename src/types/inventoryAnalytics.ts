export interface InventoryOverview {
  total_products: number;
  total_stock_ml: number;
  low_stock_items: number;
  out_of_stock_items: number;
  total_inventory_value: number;
}

export interface StockLevels {
  perfume_id: string;
  perfume_name: string;
  brand: string;
  category: string;
  current_stock_ml: number;
  stock_status: 'high' | 'medium' | 'low' | 'critical' | 'out';
  days_of_stock: number;
  reorder_recommended: boolean;
}

export interface StockMovements {
  period: string;
  purchases_ml: number;
  sales_ml: number;
  adjustments_ml: number;
  net_change_ml: number;
}

export interface InventoryTurnover {
  perfume_id: string;
  perfume_name: string;
  brand: string;
  avg_stock_ml: number;
  sold_ml: number;
  turnover_rate: number;
  days_to_sell: number;
}

export interface LotExpiration {
  lot_id: string;
  perfume_name: string;
  brand: string;
  lot_code: string;
  qty_ml: number;
  expiry_date: string;
  days_until_expiry: number;
  status: 'expired' | 'critical' | 'warning' | 'good';
}
