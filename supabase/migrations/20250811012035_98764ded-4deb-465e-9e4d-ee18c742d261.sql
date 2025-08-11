-- Fix remaining functions without search_path
ALTER FUNCTION generate_affiliate_code(text) SET search_path TO 'public';
ALTER FUNCTION update_review_helpful_count() SET search_path TO 'public';
ALTER FUNCTION calculate_notes_similarity(uuid, uuid) SET search_path TO 'public';
ALTER FUNCTION notify_new_support_chat() SET search_path TO 'public';

-- Create table for login attempts tracking (rate limiting)
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address INET,
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('success', 'failed', 'blocked')),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies for login attempts (admin only)
CREATE POLICY "Admins can view all login attempts" 
ON public.login_attempts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

-- Create index for performance
CREATE INDEX idx_login_attempts_email_created ON public.login_attempts(email, created_at DESC);
CREATE INDEX idx_login_attempts_ip_created ON public.login_attempts(ip_address, created_at DESC);

-- Create table for security audit log
CREATE TABLE public.security_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_type TEXT NOT NULL,
  event_description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies for security audit log (admin only)
CREATE POLICY "Admins can view all security logs" 
ON public.security_audit_log 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

-- Create index for performance
CREATE INDEX idx_security_audit_user_created ON public.security_audit_log(user_id, created_at DESC);
CREATE INDEX idx_security_audit_event_created ON public.security_audit_log(event_type, created_at DESC);
CREATE INDEX idx_security_audit_risk_created ON public.security_audit_log(risk_level, created_at DESC);

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  user_uuid UUID,
  event_type_param TEXT,
  event_description_param TEXT,
  ip_address_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL,
  risk_level_param TEXT DEFAULT 'low',
  metadata_param JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, event_type, event_description, ip_address, 
    user_agent, risk_level, metadata
  )
  VALUES (
    user_uuid, event_type_param, event_description_param, 
    ip_address_param, user_agent_param, risk_level_param, metadata_param
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Function to check rate limiting
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  email_param TEXT,
  ip_param INET DEFAULT NULL,
  max_attempts INTEGER DEFAULT 5,
  window_minutes INTEGER DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  email_attempts INTEGER;
  ip_attempts INTEGER;
  is_blocked BOOLEAN := false;
  block_reason TEXT;
BEGIN
  -- Count recent failed attempts by email
  SELECT COUNT(*)
  INTO email_attempts
  FROM public.login_attempts
  WHERE email = email_param
    AND attempt_type = 'failed'
    AND created_at > now() - (window_minutes || ' minutes')::interval;
  
  -- Count recent failed attempts by IP (if provided)
  IF ip_param IS NOT NULL THEN
    SELECT COUNT(*)
    INTO ip_attempts
    FROM public.login_attempts
    WHERE ip_address = ip_param
      AND attempt_type = 'failed'
      AND created_at > now() - (window_minutes || ' minutes')::interval;
  ELSE
    ip_attempts := 0;
  END IF;
  
  -- Determine if blocked
  IF email_attempts >= max_attempts THEN
    is_blocked := true;
    block_reason := 'Too many failed attempts for this email';
  ELSIF ip_param IS NOT NULL AND ip_attempts >= (max_attempts * 2) THEN
    is_blocked := true;
    block_reason := 'Too many failed attempts from this IP';
  END IF;
  
  RETURN jsonb_build_object(
    'blocked', is_blocked,
    'reason', block_reason,
    'email_attempts', email_attempts,
    'ip_attempts', ip_attempts,
    'max_attempts', max_attempts,
    'window_minutes', window_minutes
  );
END;
$$;

-- Function to log login attempt
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  email_param TEXT,
  attempt_type_param TEXT,
  ip_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL,
  metadata_param JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  attempt_id UUID;
BEGIN
  INSERT INTO public.login_attempts (
    email, attempt_type, ip_address, user_agent, metadata
  )
  VALUES (
    email_param, attempt_type_param, ip_param, user_agent_param, metadata_param
  )
  RETURNING id INTO attempt_id;
  
  RETURN attempt_id;
END;
$$;