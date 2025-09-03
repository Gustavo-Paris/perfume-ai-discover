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

-- Política para view pública (qualquer pessoa pode ver informações básicas)
CREATE POLICY "Anyone can view public company info" 
ON public.company_public_info 
FOR SELECT 
USING (true);

-- Habilitar RLS na view
ALTER VIEW public.company_public_info SET (security_invoker = true);

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

-- Log de auditoria para acesso a dados sensíveis da empresa
CREATE OR REPLACE FUNCTION public.log_company_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log apenas para acessos não-admin (admin tem acesso legítimo)
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
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
      'sensitive_data_access',
      'Tentativa de acesso não autorizado aos dados da empresa',
      'company_info',
      'high',
      inet_client_addr(),
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NULL;
END;
$$;

-- Criar trigger para log de auditoria
CREATE TRIGGER company_data_access_log
  AFTER SELECT ON public.company_info
  FOR EACH ROW
  EXECUTE FUNCTION public.log_company_data_access();