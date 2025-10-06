-- Adicionar campo cpf_cnpj à tabela addresses
ALTER TABLE public.addresses 
ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;

-- Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_addresses_cpf_cnpj ON public.addresses(cpf_cnpj);

-- Comentário explicativo
COMMENT ON COLUMN public.addresses.cpf_cnpj IS 'CPF ou CNPJ do destinatário para emissão de nota fiscal';

-- Função para validar CPF
CREATE OR REPLACE FUNCTION public.validate_cpf(cpf TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  numbers TEXT;
  sum INTEGER;
  digit1 INTEGER;
  digit2 INTEGER;
BEGIN
  -- Remove caracteres não numéricos
  numbers := REGEXP_REPLACE(cpf, '[^0-9]', '', 'g');
  
  -- Verifica tamanho
  IF LENGTH(numbers) != 11 THEN
    RETURN FALSE;
  END IF;
  
  -- Verifica sequências repetidas
  IF numbers IN ('00000000000', '11111111111', '22222222222', '33333333333', 
                 '44444444444', '55555555555', '66666666666', '77777777777', 
                 '88888888888', '99999999999') THEN
    RETURN FALSE;
  END IF;
  
  -- Calcula primeiro dígito verificador
  sum := 0;
  FOR i IN 1..9 LOOP
    sum := sum + (SUBSTRING(numbers, i, 1)::INTEGER * (11 - i));
  END LOOP;
  digit1 := 11 - (sum % 11);
  IF digit1 >= 10 THEN
    digit1 := 0;
  END IF;
  
  -- Verifica primeiro dígito
  IF digit1 != SUBSTRING(numbers, 10, 1)::INTEGER THEN
    RETURN FALSE;
  END IF;
  
  -- Calcula segundo dígito verificador
  sum := 0;
  FOR i IN 1..10 LOOP
    sum := sum + (SUBSTRING(numbers, i, 1)::INTEGER * (12 - i));
  END LOOP;
  digit2 := 11 - (sum % 11);
  IF digit2 >= 10 THEN
    digit2 := 0;
  END IF;
  
  -- Verifica segundo dígito
  IF digit2 != SUBSTRING(numbers, 11, 1)::INTEGER THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Função para validar CNPJ
CREATE OR REPLACE FUNCTION public.validate_cnpj(cnpj TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  numbers TEXT;
  sum INTEGER;
  digit1 INTEGER;
  digit2 INTEGER;
  multipliers1 INTEGER[] := ARRAY[5,4,3,2,9,8,7,6,5,4,3,2];
  multipliers2 INTEGER[] := ARRAY[6,5,4,3,2,9,8,7,6,5,4,3,2];
BEGIN
  -- Remove caracteres não numéricos
  numbers := REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g');
  
  -- Verifica tamanho
  IF LENGTH(numbers) != 14 THEN
    RETURN FALSE;
  END IF;
  
  -- Verifica sequências repetidas
  IF numbers IN ('00000000000000', '11111111111111', '22222222222222', '33333333333333',
                 '44444444444444', '55555555555555', '66666666666666', '77777777777777',
                 '88888888888888', '99999999999999') THEN
    RETURN FALSE;
  END IF;
  
  -- Calcula primeiro dígito verificador
  sum := 0;
  FOR i IN 1..12 LOOP
    sum := sum + (SUBSTRING(numbers, i, 1)::INTEGER * multipliers1[i]);
  END LOOP;
  digit1 := sum % 11;
  IF digit1 < 2 THEN
    digit1 := 0;
  ELSE
    digit1 := 11 - digit1;
  END IF;
  
  -- Verifica primeiro dígito
  IF digit1 != SUBSTRING(numbers, 13, 1)::INTEGER THEN
    RETURN FALSE;
  END IF;
  
  -- Calcula segundo dígito verificador
  sum := 0;
  FOR i IN 1..13 LOOP
    sum := sum + (SUBSTRING(numbers, i, 1)::INTEGER * multipliers2[i]);
  END LOOP;
  digit2 := sum % 11;
  IF digit2 < 2 THEN
    digit2 := 0;
  ELSE
    digit2 := 11 - digit2;
  END IF;
  
  -- Verifica segundo dígito
  IF digit2 != SUBSTRING(numbers, 14, 1)::INTEGER THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Função helper para validar CPF ou CNPJ
CREATE OR REPLACE FUNCTION public.validate_cpf_cnpj(doc TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  numbers TEXT;
BEGIN
  IF doc IS NULL OR doc = '' THEN
    RETURN FALSE;
  END IF;
  
  -- Remove caracteres não numéricos
  numbers := REGEXP_REPLACE(doc, '[^0-9]', '', 'g');
  
  -- Valida baseado no tamanho
  IF LENGTH(numbers) = 11 THEN
    RETURN public.validate_cpf(doc);
  ELSIF LENGTH(numbers) = 14 THEN
    RETURN public.validate_cnpj(doc);
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;