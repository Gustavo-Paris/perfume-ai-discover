-- Remove política pública atual que expõe todos os dados
DROP POLICY IF EXISTS "Anyone can view company info" ON public.company_info;

-- Criar nova política: apenas admins podem ver dados completos
CREATE POLICY "Admins can manage company info" 
ON public.company_info 
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Criar view pública com apenas informações básicas não sensíveis
CREATE OR REPLACE VIEW public.company_public_info AS
SELECT 
  nome_fantasia,
  cidade,
  estado,
  email_contato
FROM public.company_info
WHERE nome_fantasia IS NOT NULL;

-- Criar função para buscar informações públicas da empresa
CREATE OR REPLACE FUNCTION public.get_public_company_info()
RETURNS TABLE(
  nome_fantasia text,
  cidade text,
  estado text,
  email_contato text
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

-- Função para log de tentativas de acesso não autorizadas
CREATE OR REPLACE FUNCTION public.log_unauthorized_company_access(
  p_user_id uuid DEFAULT auth.uid(),
  p_action text DEFAULT 'unauthorized_access'
)
RETURNS void
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