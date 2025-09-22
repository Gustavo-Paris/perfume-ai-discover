-- FASE 1: CORREÇÕES DE SEGURANÇA CRÍTICAS
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

-- 3. Política RLS para perfumes: admins podem ver tudo, outros apenas view pública
CREATE POLICY "Admins can manage all perfumes" ON public.perfumes
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Habilitar RLS na tabela loyalty_tiers
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;

-- 5. Política para loyalty_tiers: apenas usuários autenticados podem ver
CREATE POLICY "Authenticated users can view loyalty tiers" ON public.loyalty_tiers
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage loyalty tiers" ON public.loyalty_tiers
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6. Criar função para obter perfumes públicos de forma segura
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
  FROM public.perfumes_public p
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
  FROM public.perfumes_public p
  WHERE p.id = perfume_id;
$$;

-- 8. Habilitar RLS em tabelas de auditoria se não estiver habilitado
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- 9. Política para logs de segurança: apenas admins
CREATE POLICY "Admins can view security audit logs" ON public.security_audit_log
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 10. Função para log de tentativas de acesso não autorizado
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
END;
$$;

-- 11. Trigger para detectar tentativas de acesso direto a dados sensíveis
CREATE OR REPLACE FUNCTION public.detect_unauthorized_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se não é admin tentando acessar dados de custo
  IF TG_TABLE_NAME = 'perfumes' AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    PERFORM public.log_security_violation(
      'unauthorized_sensitive_access',
      'perfumes',
      TG_OP,
      jsonb_build_object('attempted_columns', 'cost_data')
    );
    
    RAISE EXCEPTION 'Acesso não autorizado a dados sensíveis. Incidente registrado.';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 12. Aplicar trigger de segurança
CREATE TRIGGER perfumes_security_check
  BEFORE SELECT OR UPDATE OR DELETE ON public.perfumes
  FOR EACH ROW EXECUTE FUNCTION public.detect_unauthorized_access();

-- 13. Função para validar sessões e detectar atividade suspeita
CREATE OR REPLACE FUNCTION public.validate_session_security()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_count INTEGER;
  recent_logins INTEGER;
BEGIN
  -- Verificar múltiplas sessões simultâneas
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
  IF session_count > 3 OR recent_logins > 20 THEN
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
  
  RETURN TRUE;
END;
$$;