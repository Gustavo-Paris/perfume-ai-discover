-- Expandir sistema de cupons para ser mais robusto
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS 
  coupon_category TEXT DEFAULT 'general', -- general, shipping, first_purchase, category_specific
  applicable_categories TEXT[], -- Para cupons específicos de categorias
  free_shipping BOOLEAN DEFAULT false, -- Cupom de frete grátis
  first_purchase_only BOOLEAN DEFAULT false, -- Apenas primeira compra
  minimum_quantity INTEGER DEFAULT NULL, -- Quantidade mínima de itens
  maximum_discount_amount NUMERIC DEFAULT NULL, -- Valor máximo de desconto para cupons percentuais
  user_restrictions JSONB DEFAULT '{}', -- Restrições específicas do usuário
  usage_per_user INTEGER DEFAULT NULL, -- Limite de uso por usuário
  auto_apply BOOLEAN DEFAULT false, -- Auto aplicar em condições específicas
  stackable BOOLEAN DEFAULT false; -- Pode ser combinado com outros cupons

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
  commission_rate NUMERIC DEFAULT 0.05, -- 5% padrão
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

-- Expandir reviews para suportar fotos
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS 
  images_urls TEXT[] DEFAULT '{}',
  helpful_count INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT false;

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
ALTER TABLE cart_sessions ADD COLUMN IF NOT EXISTS 
  utm_source TEXT,
  utm_campaign TEXT,
  first_product_added_at TIMESTAMP WITHOUT TIME ZONE,
  checkout_started_at TIMESTAMP WITHOUT TIME ZONE,
  payment_attempted_at TIMESTAMP WITHOUT TIME ZONE;

-- Funções para validação de cupons expandida
CREATE OR REPLACE FUNCTION validate_coupon_advanced(
  coupon_code TEXT,
  order_total NUMERIC,
  user_uuid UUID,
  cart_items JSONB DEFAULT '[]'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  coupon_record RECORD;
  user_usage_count INTEGER := 0;
  user_order_count INTEGER := 0;
  discount_amount NUMERIC := 0;
  final_total NUMERIC;
  cart_quantity INTEGER := 0;
BEGIN
  -- Buscar dados do cupom
  SELECT * INTO coupon_record
  FROM coupons
  WHERE code = coupon_code AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Cupom não encontrado ou inativo');
  END IF;
  
  -- Verificar expiração
  IF coupon_record.expires_at IS NOT NULL AND coupon_record.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Cupom expirado');
  END IF;
  
  -- Verificar limite global de uso
  IF coupon_record.max_uses IS NOT NULL AND coupon_record.current_uses >= coupon_record.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Cupom esgotado');
  END IF;
  
  -- Verificar uso por usuário
  SELECT COALESCE(usage_count, 0) INTO user_usage_count
  FROM coupon_user_usage
  WHERE coupon_code = coupon_record.code AND user_id = user_uuid;
  
  IF coupon_record.usage_per_user IS NOT NULL AND user_usage_count >= coupon_record.usage_per_user THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Limite de uso por usuário atingido');
  END IF;
  
  -- Verificar se é primeira compra (se necessário)
  IF coupon_record.first_purchase_only THEN
    SELECT COUNT(*) INTO user_order_count
    FROM orders
    WHERE user_id = user_uuid AND payment_status = 'paid';
    
    IF user_order_count > 0 THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Cupom válido apenas para primeira compra');
    END IF;
  END IF;
  
  -- Verificar valor mínimo
  IF coupon_record.min_order_value > 0 AND order_total < coupon_record.min_order_value THEN
    RETURN jsonb_build_object(
      'valid', false, 
      'error', format('Valor mínimo do pedido: R$ %.2f', coupon_record.min_order_value)
    );
  END IF;
  
  -- Verificar quantidade mínima
  SELECT COALESCE(SUM((item->>'quantity')::INTEGER), 0) INTO cart_quantity
  FROM jsonb_array_elements(cart_items) AS item;
  
  IF coupon_record.minimum_quantity IS NOT NULL AND cart_quantity < coupon_record.minimum_quantity THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', format('Quantidade mínima de itens: %s', coupon_record.minimum_quantity)
    );
  END IF;
  
  -- Calcular desconto
  IF coupon_record.free_shipping THEN
    -- Para frete grátis, retornar informação especial
    RETURN jsonb_build_object(
      'valid', true,
      'free_shipping', true,
      'coupon_type', coupon_record.type,
      'coupon_value', coupon_record.value
    );
  ELSE
    -- Calcular desconto normal
    IF coupon_record.type = 'percent' THEN
      discount_amount := order_total * (coupon_record.value / 100);
      -- Aplicar limite máximo se definido
      IF coupon_record.maximum_discount_amount IS NOT NULL THEN
        discount_amount := LEAST(discount_amount, coupon_record.maximum_discount_amount);
      END IF;
    ELSE
      discount_amount := coupon_record.value;
    END IF;
    
    discount_amount := LEAST(discount_amount, order_total);
    final_total := order_total - discount_amount;
    
    RETURN jsonb_build_object(
      'valid', true,
      'discount_amount', discount_amount,
      'final_total', final_total,
      'coupon_type', coupon_record.type,
      'coupon_value', coupon_record.value,
      'free_shipping', false
    );
  END IF;
END;
$$;

-- Função para criar código de afiliado único
CREATE OR REPLACE FUNCTION generate_affiliate_code(user_name TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 0;
BEGIN
  -- Criar código base a partir do nome ou usar padrão
  IF user_name IS NOT NULL THEN
    base_code := UPPER(LEFT(REGEXP_REPLACE(user_name, '[^a-zA-Z0-9]', '', 'g'), 6));
  ELSE
    base_code := 'AFF';
  END IF;
  
  -- Garantir que seja único
  LOOP
    IF counter = 0 THEN
      final_code := base_code || LPAD((RANDOM() * 999)::INTEGER::TEXT, 3, '0');
    ELSE
      final_code := base_code || LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0');
    END IF;
    
    -- Verificar se já existe
    IF NOT EXISTS (SELECT 1 FROM affiliates WHERE affiliate_code = final_code) THEN
      EXIT;
    END IF;
    
    counter := counter + 1;
    IF counter > 10 THEN
      final_code := 'AFF' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0');
      EXIT;
    END IF;
  END LOOP;
  
  RETURN final_code;
END;
$$;

-- Trigger para atualizar helpful_count nas reviews
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reviews 
    SET helpful_count = helpful_count + CASE WHEN NEW.is_helpful THEN 1 ELSE 0 END
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE reviews 
    SET helpful_count = helpful_count + 
      CASE 
        WHEN NEW.is_helpful AND NOT OLD.is_helpful THEN 1
        WHEN NOT NEW.is_helpful AND OLD.is_helpful THEN -1
        ELSE 0
      END
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reviews 
    SET helpful_count = helpful_count - CASE WHEN OLD.is_helpful THEN 1 ELSE 0 END
    WHERE id = OLD.review_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_update_review_helpful_count
  AFTER INSERT OR UPDATE OR DELETE ON review_helpfulness
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();

-- RLS Policies
ALTER TABLE coupon_user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpfulness ENABLE ROW LEVEL SECURITY;

-- Políticas para coupon_user_usage
CREATE POLICY "Admins can view all coupon usage" ON coupon_user_usage
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own coupon usage" ON coupon_user_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas para affiliates
CREATE POLICY "Admins can manage all affiliates" ON affiliates
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view and manage their own affiliate data" ON affiliates
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active affiliate codes" ON affiliates
  FOR SELECT USING (status = 'active');

-- Políticas para affiliate_referrals
CREATE POLICY "Admins can manage all referrals" ON affiliate_referrals
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Affiliates can view their own referrals" ON affiliate_referrals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM affiliates 
      WHERE affiliates.id = affiliate_referrals.affiliate_id 
      AND affiliates.user_id = auth.uid()
    )
  );

-- Políticas para review_helpfulness
CREATE POLICY "Users can manage their own helpfulness votes" ON review_helpfulness
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view helpfulness votes" ON review_helpfulness
  FOR SELECT USING (true);