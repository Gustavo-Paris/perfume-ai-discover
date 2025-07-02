
export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  total_amount: number;
  subtotal: number;
  shipping_cost: number;
  status: string;
  payment_method: string;
  payment_status: string;
  transaction_id?: string;
  shipping_service?: string;
  shipping_deadline?: number;
  address_data: any;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  perfume_id: string;
  size_ml: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  perfume?: {
    id: string;
    name: string;
    brand: string;
    image_url?: string;
  };
}

export interface CreateOrderData {
  orderDraftId: string;
  paymentData: any;
  cartItems: any[];
}
