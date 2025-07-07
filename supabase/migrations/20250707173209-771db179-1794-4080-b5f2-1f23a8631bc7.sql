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