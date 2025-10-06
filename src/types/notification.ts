export interface Notification {
  id: string;
  type: 'stock_alert' | 'order_update' | 'review_approved' | 'system' | 'nfe_failure' | 'wishlist_promotion' | 'new_support_chat';
  message: string;
  user_id?: string;
  read: boolean;
  created_at: string;
  metadata?: {
    lot_id?: string;
    perfume_id?: string;
    qty_ml?: number;
    warehouse_id?: string;
    order_id?: string;
    order_number?: string;
    error?: string;
    request_id?: string;
    retry_available?: boolean;
    automation_context?: boolean;
    [key: string]: any;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: {
    [key: string]: number;
  };
}