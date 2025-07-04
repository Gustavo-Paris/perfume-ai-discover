export interface Review {
  id: string;
  perfume_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    name?: string;
    email?: string;
  };
  perfume?: {
    name: string;
    brand: string;
  };
}

export interface ReviewForm {
  rating: number;
  comment?: string;
}

export interface ReviewStats {
  total: number;
  average: number;
  distribution: {
    [key: number]: number;
  };
}