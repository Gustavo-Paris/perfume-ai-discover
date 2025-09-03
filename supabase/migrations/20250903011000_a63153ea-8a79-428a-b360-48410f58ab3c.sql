-- Corrigir funções que não têm search_path definido

-- 1. Corrigir check_rate_limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_user_id uuid DEFAULT NULL::uuid, p_ip_address inet DEFAULT NULL::inet, p_endpoint text DEFAULT 'general'::text, p_limit integer DEFAULT 60, p_window_minutes integer DEFAULT 1)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Count recent requests
  SELECT COALESCE(SUM(request_count), 0)
  INTO current_count
  FROM public.rate_limits
  WHERE (p_user_id IS NULL OR user_id = p_user_id)
    AND (p_ip_address IS NULL OR ip_address = p_ip_address)
    AND endpoint = p_endpoint
    AND window_start > window_start;
  
  -- Check if limit exceeded
  IF current_count >= p_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Record this request
  INSERT INTO public.rate_limits (user_id, ip_address, endpoint, request_count)
  VALUES (p_user_id, p_ip_address, p_endpoint, 1)
  ON CONFLICT (user_id, ip_address, endpoint, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1;
  
  RETURN TRUE;
END;
$$;

-- 2. Corrigir generate_sac_protocol
CREATE OR REPLACE FUNCTION public.generate_sac_protocol()
RETURNS text
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  next_number INTEGER;
  protocol TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(protocol_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.sac_tickets
  WHERE protocol_number ~ '^SAC[0-9]+$';
  
  protocol := 'SAC' || LPAD(next_number::TEXT, 6, '0');
  RETURN protocol;
END;
$$;

-- 3. Corrigir log_compliance_event
CREATE OR REPLACE FUNCTION public.log_compliance_event(p_user_id uuid, p_action_type text, p_resource_type text, p_resource_id text DEFAULT NULL::text, p_details jsonb DEFAULT '{}'::jsonb, p_legal_basis text DEFAULT 'consent'::text, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_session_id text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.compliance_audit_log (
    user_id, action_type, resource_type, resource_id, 
    details, legal_basis, ip_address, user_agent, session_id
  )
  VALUES (
    p_user_id, p_action_type, p_resource_type, p_resource_id,
    p_details, p_legal_basis, p_ip_address, p_user_agent, p_session_id
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- 4. Corrigir set_sac_protocol
CREATE OR REPLACE FUNCTION public.set_sac_protocol()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.protocol_number IS NULL OR NEW.protocol_number = '' THEN
    NEW.protocol_number := generate_sac_protocol();
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Corrigir update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;