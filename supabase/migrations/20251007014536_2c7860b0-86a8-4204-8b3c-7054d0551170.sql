-- ========================================
-- FASE 1.1: Corrigir RLS Policies - profiles
-- ========================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Criar políticas seguras para profiles
-- Usuários podem ver e editar APENAS seu próprio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- ========================================
-- FASE 1.2: Proteger company_settings/company_info
-- ========================================

-- Criar função SECURITY DEFINER para dados públicos da empresa
-- Retorna APENAS informações não sensíveis
CREATE OR REPLACE FUNCTION public.get_public_company_info()
RETURNS TABLE(
  nome_fantasia TEXT,
  cidade TEXT,
  estado TEXT,
  email_contato TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ci.nome_fantasia,
    ci.cidade,
    ci.estado,
    ci.email_contato
  FROM public.company_info ci
  WHERE ci.nome_fantasia IS NOT NULL
  LIMIT 1;
$$;

-- Função para logar tentativas de acesso não autorizadas
CREATE OR REPLACE FUNCTION public.log_unauthorized_company_access(
  p_user_id UUID DEFAULT auth.uid(),
  p_action TEXT DEFAULT 'unauthorized_access'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log tentativas de acesso não autorizadas aos dados da empresa
  IF NOT has_role(p_user_id, 'admin'::app_role) THEN
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
      p_user_id,
      'sensitive_data_access',
      'Tentativa de acesso não autorizado aos dados da empresa',
      'company_info',
      'high',
      inet_client_addr(),
      jsonb_build_object(
        'action', p_action,
        'timestamp', now(),
        'blocked', true
      )
    );
  END IF;
END;
$$;

-- ========================================
-- Criar tabela de logs de acesso a perfis (para auditoria)
-- ========================================

CREATE TABLE IF NOT EXISTS public.profile_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_profile_id UUID NOT NULL,
  access_type TEXT NOT NULL, -- 'view', 'update', 'admin_access'
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para profile_access_log: apenas admins podem ver
ALTER TABLE public.profile_access_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view profile access logs" ON public.profile_access_log;
DROP POLICY IF EXISTS "System can insert profile access logs" ON public.profile_access_log;

CREATE POLICY "Only admins can view profile access logs"
ON public.profile_access_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert profile access logs"
ON public.profile_access_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profile_access_log_viewer ON public.profile_access_log(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_access_log_viewed ON public.profile_access_log(viewed_profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_access_log_created ON public.profile_access_log(created_at DESC);

-- Comentários para documentação
COMMENT ON FUNCTION public.get_public_company_info() IS 'Retorna apenas informações públicas da empresa (não sensíveis): nome fantasia, cidade, estado e email de contato';
COMMENT ON FUNCTION public.log_unauthorized_company_access(UUID, TEXT) IS 'Registra tentativas de acesso não autorizado aos dados sensíveis da empresa';
COMMENT ON TABLE public.profile_access_log IS 'Log de auditoria de acessos a perfis de usuários para compliance LGPD';