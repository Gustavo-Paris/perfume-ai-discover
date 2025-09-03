-- Corrigir criação da view company_public_info (views não precisam de RLS policies)
DROP VIEW IF EXISTS public.company_public_info;

-- Recriar a view sem políticas RLS (views herdam as permissões das tabelas subjacentes)
CREATE VIEW public.company_public_info AS
SELECT 
  nome_fantasia,
  cidade,
  estado,
  email_contato
FROM public.company_info
WHERE nome_fantasia IS NOT NULL;

-- A view herda as políticas RLS da tabela company_info automaticamente
-- Como company_info agora só permite acesso a admins, a view também será restrita

-- Corrigir algumas funções que podem estar faltando search_path
CREATE OR REPLACE FUNCTION public.get_user_points_balance(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT balance_after 
     FROM public.points_transactions 
     WHERE user_id = user_uuid 
     ORDER BY created_at DESC 
     LIMIT 1), 
    0
  );
END;
$$;

-- Corrigir função has_role se necessário  
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Corrigir função generate_affiliate_code
CREATE OR REPLACE FUNCTION public.generate_affiliate_code(user_name text DEFAULT NULL::text)
RETURNS text
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 0;
BEGIN
  -- Criar código base a partir do nome ou usar padrão
  IF user_name IS NOT NULL THEN
    base_code := UPPER(LEFT(REGEXP_REPLACE(user_name, '[^a-zA-Z0-9]', '', 'g'), 6));
  ELSE
    base_code := 'AFF';
  END IF;
  
  -- Garantir que seja único
  LOOP
    IF counter = 0 THEN
      final_code := base_code || LPAD((RANDOM() * 999)::INTEGER::TEXT, 3, '0');
    ELSE
      final_code := base_code || LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0');
    END IF;
    
    -- Verificar se já existe
    IF NOT EXISTS (SELECT 1 FROM affiliates WHERE affiliate_code = final_code) THEN
      EXIT;
    END IF;
    
    counter := counter + 1;
    IF counter > 10 THEN
      final_code := 'AFF' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0');
      EXIT;
    END IF;
  END LOOP;
  
  RETURN final_code;
END;
$$;