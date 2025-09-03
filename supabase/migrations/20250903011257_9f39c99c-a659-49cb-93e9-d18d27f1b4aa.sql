-- Remover completamente a configuração security_invoker da view company_public_info
-- que pode estar causando o alerta de Security Definer View

DROP VIEW IF EXISTS public.company_public_info;

-- Recriar a view sem nenhuma configuração de segurança especial
CREATE VIEW public.company_public_info AS
SELECT 
  nome_fantasia,
  cidade,
  estado,
  email_contato
FROM public.company_info
WHERE nome_fantasia IS NOT NULL;

-- A view agora herdará naturalmente as políticas RLS da tabela subjacente
-- sem precisar de configurações especiais de segurança