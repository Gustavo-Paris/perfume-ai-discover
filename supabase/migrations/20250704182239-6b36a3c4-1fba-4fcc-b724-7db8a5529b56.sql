-- Create coupons table
CREATE TABLE public.coupons (
  code TEXT NOT NULL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('percent', 'value')),
  value NUMERIC NOT NULL CHECK (value > 0),
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  min_order_value NUMERIC DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create coupon_redemptions table
CREATE TABLE public.coupon_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL REFERENCES public.coupons(code) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  discount_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one redemption per order
  UNIQUE(order_id)
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coupons
CREATE POLICY "Anyone can view active coupons"
ON public.coupons
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage coupons"
ON public.coupons
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for coupon_redemptions
CREATE POLICY "Users can view their own redemptions"
ON public.coupon_redemptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own redemptions"
ON public.coupon_redemptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all redemptions"
ON public.coupon_redemptions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(
  coupon_code TEXT,
  order_total NUMERIC,
  user_uuid UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  coupon_record RECORD;
  discount_amount NUMERIC := 0;
  final_total NUMERIC;
BEGIN
  -- Get coupon details
  SELECT * INTO coupon_record
  FROM public.coupons
  WHERE code = coupon_code
  AND is_active = true;
  
  -- Check if coupon exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Cupom não encontrado ou inativo'
    );
  END IF;
  
  -- Check if expired
  IF coupon_record.expires_at IS NOT NULL AND coupon_record.expires_at < now() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Cupom expirado'
    );
  END IF;
  
  -- Check usage limit
  IF coupon_record.max_uses IS NOT NULL AND coupon_record.current_uses >= coupon_record.max_uses THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Cupom esgotado'
    );
  END IF;
  
  -- Check minimum order value
  IF coupon_record.min_order_value > 0 AND order_total < coupon_record.min_order_value THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', format('Valor mínimo do pedido: R$ %.2f', coupon_record.min_order_value)
    );
  END IF;
  
  -- Calculate discount
  IF coupon_record.type = 'percent' THEN
    discount_amount := order_total * (coupon_record.value / 100);
  ELSE
    discount_amount := coupon_record.value;
  END IF;
  
  -- Ensure discount doesn't exceed order total
  discount_amount := LEAST(discount_amount, order_total);
  final_total := order_total - discount_amount;
  
  RETURN jsonb_build_object(
    'valid', true,
    'discount_amount', discount_amount,
    'final_total', final_total,
    'coupon_type', coupon_record.type,
    'coupon_value', coupon_record.value
  );
END;
$$;

-- Function to apply coupon to order
CREATE OR REPLACE FUNCTION public.apply_coupon_to_order(
  coupon_code TEXT,
  order_uuid UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_record RECORD;
  validation_result JSONB;
  discount_amount NUMERIC;
BEGIN
  -- Get order details
  SELECT * INTO order_record
  FROM public.orders
  WHERE id = order_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;
  
  -- Validate coupon
  SELECT public.validate_coupon(coupon_code, order_record.subtotal, order_record.user_id)
  INTO validation_result;
  
  IF NOT (validation_result->>'valid')::boolean THEN
    RAISE EXCEPTION '%', validation_result->>'error';
  END IF;
  
  discount_amount := (validation_result->>'discount_amount')::numeric;
  
  -- Update order total
  UPDATE public.orders
  SET total_amount = subtotal + shipping_cost - discount_amount
  WHERE id = order_uuid;
  
  -- Record redemption
  INSERT INTO public.coupon_redemptions (code, order_id, user_id, discount_amount)
  VALUES (coupon_code, order_uuid, order_record.user_id, discount_amount);
  
  -- Update coupon usage count
  UPDATE public.coupons
  SET current_uses = current_uses + 1
  WHERE code = coupon_code;
  
  RETURN true;
END;
$$;

-- Create indexes
CREATE INDEX idx_coupons_active_expires ON public.coupons(is_active, expires_at);
CREATE INDEX idx_coupon_redemptions_user ON public.coupon_redemptions(user_id);
CREATE INDEX idx_coupon_redemptions_order ON public.coupon_redemptions(order_id);