-- Expandir sistema de cupons para ser mais robusto
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS coupon_category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS applicable_categories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS first_purchase_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS minimum_quantity INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS maximum_discount_amount NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS user_restrictions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS usage_per_user INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS auto_apply BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stackable BOOLEAN DEFAULT false;

-- Tabela para rastrear uso de cupons por usuário
CREATE TABLE IF NOT EXISTS coupon_user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_code TEXT NOT NULL,
  user_id UUID NOT NULL,
  usage_count INTEGER DEFAULT 1,
  first_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (coupon_code) REFERENCES coupons(code),
  UNIQUE(coupon_code, user_id)
);

-- Programa de afiliados
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  affiliate_code TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC DEFAULT 0.05,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  total_earnings NUMERIC DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Referências de afiliados
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL,
  referred_user_id UUID,
  order_id UUID,
  commission_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (affiliate_id) REFERENCES affiliates(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);