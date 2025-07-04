export interface Reservation {
  id: string;
  perfume_id: string;
  size_ml: 5 | 10;
  qty: number;
  user_id?: string;
  expires_at: string;
  created_at: string;
  // Joined data
  perfume?: {
    name: string;
    brand: string;
  };
}

export interface StockAvailability {
  perfume_id: string;
  size_ml: 5 | 10;
  available: number;
  total: number;
  reserved: number;
}