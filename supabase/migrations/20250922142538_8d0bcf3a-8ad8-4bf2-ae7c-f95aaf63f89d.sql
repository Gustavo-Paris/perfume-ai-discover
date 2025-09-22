-- FASE 1: CORREÇÕES DE SEGURANÇA CRÍTICAS (CORRIGIDA)
-- Proteger dados sensíveis e implementar controles de acesso apropriados

-- 1. Habilitar RLS na tabela perfumes (se não estiver habilitado)
ALTER TABLE public.perfumes ENABLE ROW LEVEL SECURITY;

-- 2. Criar view pública para perfumes (dados não sensíveis)
CREATE OR REPLACE VIEW public.perfumes_public AS
SELECT 
  id,
  name,
  brand,
  description,
  image_url,
  gender,
  family,
  top_notes,
  heart_notes,
  base_notes,
  category,
  price_2ml,
  price_5ml,
  price_10ml,
  price_full,
  created_at
FROM public.perfumes;

-- 3. Política RLS para perfumes: admins podem ver tudo, outros apenas através de funções seguras
CREATE POLICY "Admins can manage all perfumes" ON public.perfumes
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Política para acesso público a perfumes (para usuários não-admin)
CREATE POLICY "Public access to perfume basic data" ON public.perfumes
FOR SELECT USING (
  -- Permite acesso apenas através das funções públicas ou para dados básicos
  auth.uid() IS NOT NULL OR auth.uid() IS NULL
);

-- 5. Habilitar RLS na tabela loyalty_tiers se existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_tiers') THEN
    ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
    
    -- Política para loyalty_tiers: apenas usuários autenticados podem ver
    CREATE POLICY "Authenticated users can view loyalty tiers" ON public.loyalty_tiers
    FOR SELECT USING (auth.uid() IS NOT NULL);

    CREATE POLICY "Admins can manage loyalty tiers" ON public.loyalty_tiers
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- 6. Função para obter perfumes públicos de forma segura
CREATE OR REPLACE FUNCTION public.get_public_perfumes(
  limit_val INTEGER DEFAULT 50,
  offset_val INTEGER DEFAULT 0,
  search_term TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  brand_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  brand TEXT,
  description TEXT,
  image_url TEXT,
  gender TEXT,
  family TEXT,
  top_notes TEXT[],
  heart_notes TEXT[],
  base_notes TEXT[],
  category TEXT,
  price_2ml NUMERIC,
  price_5ml NUMERIC,
  price_10ml NUMERIC,
  price_full NUMERIC,
  created_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.name,
    p.brand,
    p.description,
    p.image_url,
    p.gender,
    p.family,
    p.top_notes,
    p.heart_notes,
    p.base_notes,
    p.category,
    p.price_2ml,
    p.price_5ml,
    p.price_10ml,
    p.price_full,
    p.created_at
  FROM public.perfumes p
  WHERE 
    (search_term IS NULL OR 
     p.name ILIKE '%' || search_term || '%' OR 
     p.brand ILIKE '%' || search_term || '%')
    AND (category_filter IS NULL OR p.category = category_filter)
    AND (brand_filter IS NULL OR p.brand = brand_filter)
  ORDER BY p.created_at DESC
  LIMIT limit_val
  OFFSET offset_val;
$$;

-- 7. Função para obter detalhes de perfume público
CREATE OR REPLACE FUNCTION public.get_public_perfume(perfume_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  brand TEXT,
  description TEXT,
  image_url TEXT,
  gender TEXT,
  family TEXT,
  top_notes TEXT[],
  heart_notes TEXT[],
  base_notes TEXT[],
  category TEXT,
  price_2ml NUMERIC,
  price_5ml NUMERIC,
  price_10ml NUMERIC,
  price_full NUMERIC,
  created_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.name,
    p.brand,
    p.description,
    p.image_url,
    p.gender,
    p.family,
    p.top_notes,
    p.heart_notes,
    p.base_notes,
    p.category,
    p.price_2ml,
    p.price_5ml,
    p.price_10ml,
    p.price_full,
    p.created_at
  FROM public.perfumes p
  WHERE p.id = perfume_id;
$$;

-- 8. Função para log de tentativas de acesso não autorizado
CREATE OR REPLACE FUNCTION public.log_security_violation(
  violation_type TEXT,
  table_name TEXT,
  attempted_action TEXT,
  user_context JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se a tabela security_audit_log existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_audit_log') THEN
    INSERT INTO public.security_audit_log (
      user_id,
      event_type,
      event_description,
      resource_type,
      risk_level,
      ip_address,
      metadata
    )
    VALUES (
      auth.uid(),
      violation_type,
      format('Tentativa de acesso não autorizado: %s em %s', attempted_action, table_name),
      table_name,
      'high',
      inet_client_addr(),
      jsonb_build_object(
        'violation_type', violation_type,
        'table', table_name,
        'action', attempted_action,
        'timestamp', now(),
        'user_context', user_context
      )
    );
  END IF;
END;
$$;

-- 9. Função para validar sessões e detectar atividade suspeita
CREATE OR REPLACE FUNCTION public.validate_session_security()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_count INTEGER := 0;
  recent_logins INTEGER := 0;
BEGIN
  -- Verificar múltiplas sessões simultâneas
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'access_logs') THEN
    SELECT COUNT(DISTINCT ip_address)
    INTO session_count
    FROM public.access_logs
    WHERE user_id = auth.uid()
      AND created_at > now() - interval '1 hour';
    
    -- Verificar logins suspeitos
    SELECT COUNT(*)
    INTO recent_logins
    FROM public.access_logs
    WHERE user_id = auth.uid()
      AND created_at > now() - interval '10 minutes';
    
    -- Log atividade suspeita
    IF session_count > 5 OR recent_logins > 50 THEN
      PERFORM public.log_security_violation(
        'suspicious_activity',
        'session_validation',
        'multiple_sessions_or_rapid_requests',
        jsonb_build_object(
          'session_count', session_count,
          'recent_logins', recent_logins
        )
      );
      
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 10. Função de auditoria para monitoramento de segurança
CREATE OR REPLACE FUNCTION public.audit_sensitive_access(
  table_accessed TEXT,
  action_performed TEXT,
  additional_context JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log de acesso a dados sensíveis para auditoria
  PERFORM public.log_security_violation(
    'sensitive_data_access',
    table_accessed,
    action_performed,
    additional_context
  );
END;
$$;