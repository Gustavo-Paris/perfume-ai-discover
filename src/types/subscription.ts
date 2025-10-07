export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'past_due';
export type ShipmentStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'failed';
export type IntensityPreference = 'light' | 'medium' | 'strong' | 'any';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  decants_per_month: number;
  size_ml: number;
  stripe_price_id: string | null;
  features: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export interface SubscriptionPreferences {
  id: string;
  subscription_id: string;
  preferred_families: string[];
  preferred_gender: string[];
  excluded_notes: string[];
  intensity_preference: IntensityPreference;
  surprise_me: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionShipment {
  id: string;
  subscription_id: string;
  month_year: string;
  perfume_ids: string[];
  status: ShipmentStatus;
  tracking_code: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  order_id: string | null;
  selection_reasoning: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionHistory {
  id: string;
  subscription_id: string;
  event_type: string;
  event_data: Record<string, any>;
  created_by: string | null;
  created_at: string;
}

export interface SubscriptionWithDetails extends UserSubscription {
  preferences?: SubscriptionPreferences;
  recent_shipments?: SubscriptionShipment[];
}
