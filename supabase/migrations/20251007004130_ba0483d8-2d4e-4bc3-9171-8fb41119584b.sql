-- FASE 2.2: Correção de Problemas de Segurança do Linter - Parte 1

-- 1. Drop função existente com assinatura completa
DROP FUNCTION IF EXISTS public.log_security_event(uuid, text, text, text, jsonb);

-- 2. Corrigir funções sem search_path definido

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_sac_protocol()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.protocol_number IS NULL OR NEW.protocol_number = '' THEN
    NEW.protocol_number := generate_sac_protocol();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_support_chat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (type, message, user_id, metadata)
  SELECT 
    'new_support_chat',
    'Nova conversa de suporte criada',
    ur.user_id,
    jsonb_build_object(
      'conversation_id', NEW.id,
      'subject', NEW.subject,
      'priority', NEW.priority
    )
  FROM public.user_roles ur
  WHERE ur.role = 'admin';
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_wishlist_promotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
BEGIN
  IF NEW.is_active = true AND NEW.starts_at <= now() AND NEW.ends_at > now() THEN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.is_active = false OR OLD.starts_at > now())) THEN
      FOR user_record IN
        SELECT DISTINCT w.user_id, p.name, p.brand
        FROM public.wishlist w
        JOIN public.perfumes p ON w.perfume_id = p.id
        WHERE w.perfume_id = NEW.perfume_id
      LOOP
        INSERT INTO public.notifications (type, message, user_id, metadata)
        VALUES (
          'wishlist_promotion',
          format('🔥 %s - %s está em promoção! %s', 
                 user_record.brand, 
                 user_record.name, 
                 NEW.title),
          user_record.user_id,
          jsonb_build_object(
            'promotion_id', NEW.id,
            'perfume_id', NEW.perfume_id,
            'discount_type', NEW.discount_type,
            'discount_value', NEW.discount_value,
            'ends_at', NEW.ends_at
          )
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Função para verificar rate limiting
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_endpoint text DEFAULT 'general',
  p_limit integer DEFAULT 60,
  p_window_minutes integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  SELECT COALESCE(SUM(request_count), 0)
  INTO current_count
  FROM public.rate_limits
  WHERE (p_user_id IS NULL OR user_id = p_user_id)
    AND (p_ip_address IS NULL OR ip_address::text = p_ip_address)
    AND endpoint = p_endpoint
    AND window_start > window_start;
  
  IF current_count >= p_limit THEN
    RETURN FALSE;
  END IF;
  
  INSERT INTO public.rate_limits (user_id, ip_address, endpoint, request_count)
  VALUES (p_user_id, p_ip_address::inet, p_endpoint, 1)
  ON CONFLICT (user_id, ip_address, endpoint, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1;
  
  RETURN TRUE;
END;
$$;

-- 4. Criar tabela para audit log de segurança
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_description text NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  resource_type text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view security audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "System can insert security audit logs" ON public.security_audit_log;

CREATE POLICY "Admins can view security audit logs"
ON public.security_audit_log FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert security audit logs"
ON public.security_audit_log FOR INSERT TO authenticated
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_risk_level ON public.security_audit_log(risk_level);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_start DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON public.rate_limits(user_id, ip_address, endpoint, window_start);