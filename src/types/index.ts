export interface Perfume {
  id: string;
  name: string;
  brand: string;
  family: string;
  gender: 'masculino' | 'feminino' | 'unissex';
  size_ml?: number[]; // Optional for database compatibility
  price_full: number;
  price_2ml?: number | null;
  price_5ml?: number | null;
  price_10ml?: number | null;
  stock_full?: number; // Optional for database compatibility
  stock_5ml?: number; // Optional for database compatibility
  stock_10ml?: number; // Optional for database compatibility
  description?: string | null;
  image_url?: string | null;
  top_notes?: string[] | null;
  heart_notes?: string[] | null;
  base_notes?: string[] | null;
  created_at: string;
  category?: string | null;
  product_type?: 'decant' | 'miniature' | 'both' | null;
  source_size_ml?: number | null;
  available_sizes?: number[] | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  points: number;
  tier: 'Silver' | 'Gold' | 'Platinum';
  created_at: string;
}

export interface CartItem {
  perfume: Perfume;
  size: number;
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: 'card' | 'pix';
  items: OrderItem[];
  created_at: string;
}

export interface OrderItem {
  id: string;
  perfume_id: string;
  size_ml: number;
  quantity: number;
  unit_price: number;
}

export interface RecommendationSession {
  id: string;
  user_id?: string;
  answers: Record<string, any>;
  recommended_perfumes: Perfume[];
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  perfume_id: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  name: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  cep: string;
  country: string;
  is_default?: boolean; // Added this property
  created_at: string;
}

// New types for inventory management
export interface DatabasePerfume {
  id: string;
  brand: string;
  name: string;
  description: string | null;
  family: string;
  gender: 'masculino' | 'feminino' | 'unissex';
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];
  price_2ml?: number | null;
  price_5ml: number | null;
  price_10ml: number | null;
  price_full: number;
  image_url: string | null;
  category: string | null;
  avg_cost_per_ml?: number | null;
  target_margin_percentage?: number | null;
  last_cost_calculation?: string | null;
  product_type?: 'decant' | 'miniature' | 'both';
  source_size_ml?: number;
  available_sizes?: number[];
  created_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  is_primary: boolean;
  created_at: string;
}

export interface InventoryLot {
  id: string;
  perfume_id: string;
  lot_code: string;
  expiry_date: string | null;
  qty_ml: number;
  warehouse_id: string;
  cost_per_ml?: number;
  total_cost?: number;
  supplier?: string;
  created_at: string;
}

export interface StockMovement {
  id: string;
  perfume_id: string;
  lot_id: string | null;
  change_ml: number;
  movement_type: 'purchase' | 'fraction' | 'sale' | 'return' | 'adjust';
  related_order_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'customer';
  created_at: string;
}

export interface CartItemDB {
  id: string;
  user_id: string | null;
  perfume_id: string;
  size_ml: number;
  quantity: number;
  created_at: string;
}

export interface OrderDraft {
  id: string;
  user_id: string;
  address_id: string | null;
  shipping_service: string | null;
  shipping_cost: number | null;
  status: 'draft' | 'quote_ready' | 'confirmed';
  created_at: string;
  updated_at: string;
}

export interface ShippingQuote {
  service: string;
  company: string;
  price: number;
  deadline: number;
  service_id: number | string;
  company_id: number | string;
  local?: boolean;
  pickup_address?: string;
  pickup_instructions?: string;
}

export interface CheckoutStep {
  step: number;
  title: string;
  completed: boolean;
}
