-- Expandir reviews para suportar fotos
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS images_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN DEFAULT false;

-- Tabela para rastrear votos de "útil" nas reviews
CREATE TABLE IF NOT EXISTS review_helpfulness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL,
  user_id UUID NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  UNIQUE(review_id, user_id)
);

-- Expandir carrinho para melhor tracking de abandono
ALTER TABLE cart_sessions 
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS first_product_added_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS checkout_started_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_attempted_at TIMESTAMP WITHOUT TIME ZONE;