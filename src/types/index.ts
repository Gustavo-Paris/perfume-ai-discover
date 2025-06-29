
export interface Perfume {
  id: string;
  name: string;
  brand: string;
  family: string;
  gender: 'masculino' | 'feminino' | 'unissex';
  size_ml: number[];
  price_full: number;
  price_5ml: number;
  price_10ml: number;
  stock_full: number;
  stock_5ml: number;
  stock_10ml: number;
  description: string;
  image_url: string;
  notes: {
    top: string[];
    heart: string[];
    base: string[];
  };
  created_at: string;
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
  created_at: string;
}
