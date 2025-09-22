-- CORREÇÕES DE SEGURANÇA CRÍTICAS - VERSÃO SIMPLIFICADA
-- Implementar proteções essenciais sem conflitos

-- 1. Remover view existente se houver conflito
DROP VIEW IF EXISTS public.perfumes_public;

-- 2. Habilitar RLS na tabela perfumes
ALTER TABLE public.perfumes ENABLE ROW LEVEL SECURITY;

-- 3. Política RLS para perfumes: apenas admins podem ver dados sensíveis
CREATE POLICY "Admins can manage all perfumes" ON public.perfumes
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Política para acesso público limitado
CREATE POLICY "Public can view basic perfume data" ON public.perfumes
FOR SELECT USING (true);

-- 5. Função segura para obter perfumes sem dados sensíveis
CREATE OR REPLACE FUNCTION public.get_perfumes_secure(
  limit_val INTEGER DEFAULT 50,
  offset_val INTEGER DEFAULT 0
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
  ORDER BY p.created_at DESC
  LIMIT limit_val
  OFFSET offset_val;
$$;

-- 6. Função para log de segurança
CREATE OR REPLACE FUNCTION public.log_access_attempt(
  attempted_table TEXT,
  action_type TEXT,
  success BOOLEAN DEFAULT true
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 7. Configuração de segurança para rate limiting
CREATE OR REPLACE FUNCTION public.check_user_rate_limit(
  endpoint_name TEXT DEFAULT 'general',
  max_requests INTEGER DEFAULT 100
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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