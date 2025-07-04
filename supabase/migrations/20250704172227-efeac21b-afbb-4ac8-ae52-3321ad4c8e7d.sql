-- Create reservations table for stock locking
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  perfume_id UUID NOT NULL REFERENCES public.perfumes(id) ON DELETE CASCADE,
  size_ml INTEGER NOT NULL CHECK (size_ml IN (5, 10)),
  qty INTEGER NOT NULL CHECK (qty > 0),
  user_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one reservation per user per perfume per size
  UNIQUE(perfume_id, size_ml, user_id)
);

-- Create notifications table for stock alerts
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('stock_alert', 'order_update', 'review_approved', 'system')),
  message TEXT NOT NULL,
  user_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Add metadata for different notification types
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reservations
CREATE POLICY "Users can manage their own reservations"
ON public.reservations
FOR ALL
USING ((auth.uid() = user_id) OR (user_id IS NULL))
WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL));

CREATE POLICY "Admins can view all reservations"
ON public.reservations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING ((auth.uid() = user_id) OR (user_id IS NULL));

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING ((auth.uid() = user_id) OR (user_id IS NULL))
WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL));

CREATE POLICY "Admins can manage all notifications"
ON public.notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Function to check available stock considering reservations
CREATE OR REPLACE FUNCTION public.get_available_stock(perfume_uuid UUID, size_ml_param INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_stock INTEGER := 0;
  reserved_stock INTEGER := 0;
BEGIN
  -- Get total stock from inventory lots
  SELECT COALESCE(SUM(qty_ml), 0) / size_ml_param
  INTO total_stock
  FROM public.inventory_lots 
  WHERE perfume_id = perfume_uuid;
  
  -- Get currently reserved stock (non-expired)
  SELECT COALESCE(SUM(qty), 0)
  INTO reserved_stock
  FROM public.reservations 
  WHERE perfume_id = perfume_uuid 
  AND size_ml = size_ml_param
  AND expires_at > now();
  
  RETURN GREATEST(0, total_stock - reserved_stock);
END;
$$;

-- Function to create or update reservation
CREATE OR REPLACE FUNCTION public.upsert_reservation(
  perfume_uuid UUID,
  size_ml_param INTEGER,
  qty_param INTEGER,
  user_uuid UUID DEFAULT NULL,
  expires_minutes INTEGER DEFAULT 20
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reservation_id UUID;
  available_stock INTEGER;
BEGIN
  -- Check available stock
  SELECT public.get_available_stock(perfume_uuid, size_ml_param) INTO available_stock;
  
  -- Get current reservation qty if exists
  SELECT COALESCE(qty, 0) INTO available_stock
  FROM public.reservations 
  WHERE perfume_id = perfume_uuid 
  AND size_ml = size_ml_param 
  AND user_id = user_uuid
  AND expires_at > now();
  
  available_stock := available_stock + COALESCE(
    (SELECT qty FROM public.reservations 
     WHERE perfume_id = perfume_uuid AND size_ml = size_ml_param AND user_id = user_uuid),
    0
  );
  
  -- Check if enough stock available
  IF available_stock < qty_param THEN
    RAISE EXCEPTION 'Estoque insuficiente. Disponível: %', available_stock;
  END IF;
  
  -- Upsert reservation
  INSERT INTO public.reservations (perfume_id, size_ml, qty, user_id, expires_at)
  VALUES (perfume_uuid, size_ml_param, qty_param, user_uuid, now() + (expires_minutes || ' minutes')::interval)
  ON CONFLICT (perfume_id, size_ml, user_id)
  DO UPDATE SET 
    qty = qty_param,
    expires_at = now() + (expires_minutes || ' minutes')::interval,
    created_at = now()
  RETURNING id INTO reservation_id;
  
  RETURN reservation_id;
END;
$$;

-- Function to cleanup expired reservations
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.reservations 
  WHERE expires_at <= now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to check low stock and create notifications
CREATE OR REPLACE FUNCTION public.check_low_stock_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  alert_count INTEGER := 0;
  lot_record RECORD;
BEGIN
  -- Check for lots with less than 30ml
  FOR lot_record IN
    SELECT il.*, p.name, p.brand
    FROM public.inventory_lots il
    JOIN public.perfumes p ON il.perfume_id = p.id
    WHERE il.qty_ml < 30
  LOOP
    -- Check if alert already exists for this lot in last 24 hours
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE type = 'stock_alert' 
      AND metadata->>'lot_id' = lot_record.id::text
      AND created_at > now() - interval '24 hours'
    ) THEN
      -- Create admin notification
      INSERT INTO public.notifications (type, message, user_id, metadata)
      SELECT 
        'stock_alert',
        format('Estoque baixo: %s - %s (%s ml restantes)', 
               lot_record.brand, lot_record.name, lot_record.qty_ml),
        ur.user_id,
        jsonb_build_object(
          'lot_id', lot_record.id,
          'perfume_id', lot_record.perfume_id,
          'qty_ml', lot_record.qty_ml,
          'warehouse_id', lot_record.warehouse_id
        )
      FROM public.user_roles ur
      WHERE ur.role = 'admin'::app_role;
      
      -- Send email alert to admins
      PERFORM public.trigger_email_notification('stock_alert', lot_record.id);
      
      alert_count := alert_count + 1;
    END IF;
  END LOOP;
  
  RETURN alert_count;
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_reservations_expires_at ON public.reservations(expires_at);
CREATE INDEX idx_reservations_perfume_size ON public.reservations(perfume_id, size_ml);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_type_created ON public.notifications(type, created_at);