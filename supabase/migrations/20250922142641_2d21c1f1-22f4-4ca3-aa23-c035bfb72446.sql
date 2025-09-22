-- CORREÇÃO DOS AVISOS DE SEGURANÇA
-- Aplicar correções para os warnings detectados pelo linter

-- 1. Corrigir search_path nas funções existentes
CREATE OR REPLACE FUNCTION public.log_access_attempt(
  attempted_table TEXT,
  action_type TEXT,
  success BOOLEAN DEFAULT true
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log básico de tentativas de acesso
  INSERT INTO public.access_logs (user_id, route, ip_address, user_agent)
  VALUES (
    auth.uid(),
    format('table_access:%s:%s', attempted_table, action_type),
    inet_client_addr(),
    'security_audit'
  );
EXCEPTION WHEN OTHERS THEN
  -- Ignorar erros de log para não bloquear operações
  NULL;
END;
$$;

-- 2. Corrigir search_path na função de rate limiting
CREATE OR REPLACE FUNCTION public.check_user_rate_limit(
  endpoint_name TEXT DEFAULT 'general',
  max_requests INTEGER DEFAULT 100
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_requests INTEGER;
BEGIN
  -- Contar requests da última hora
  SELECT COUNT(*)
  INTO current_requests
  FROM public.access_logs
  WHERE user_id = auth.uid()
    AND created_at > now() - interval '1 hour'
    AND route LIKE '%' || endpoint_name || '%';
  
  -- Permitir se dentro do limite
  IF current_requests < max_requests THEN
    PERFORM public.log_access_attempt(endpoint_name, 'rate_check', true);
    RETURN true;
  ELSE
    PERFORM public.log_access_attempt(endpoint_name, 'rate_limit_exceeded', false);
    RETURN false;
  END IF;
END;
$$;

-- 3. Função adicional de segurança com search_path correto
CREATE OR REPLACE FUNCTION public.secure_perfume_access(perfume_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log tentativa de acesso a perfume específico
  PERFORM public.log_access_attempt('perfumes', 'view_detail', true);
  
  -- Sempre permitir visualização de dados básicos
  RETURN true;
END;
$$;

-- 4. Criar função para auditoria de performance
CREATE OR REPLACE FUNCTION public.track_query_performance(
  query_type TEXT,
  execution_time_ms INTEGER,
  rows_affected INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log básico de performance para auditoria
  INSERT INTO public.access_logs (user_id, route, ip_address, user_agent)
  VALUES (
    auth.uid(),
    format('performance:%s:%sms:%srows', query_type, execution_time_ms, rows_affected),
    inet_client_addr(),
    'performance_audit'
  );
EXCEPTION WHEN OTHERS THEN
  -- Ignorar erros para não impactar performance
  NULL;
END;
$$;

-- 5. Função de validação de entrada para prevenir ataques
CREATE OR REPLACE FUNCTION public.sanitize_search_input(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remover caracteres potencialmente perigosos
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(input_text, '[<>"\''();]', '', 'g'),
      '--.*$', '', 'g'
    ),
    '/\*.*?\*/', '', 'g'
  );
END;
$$;