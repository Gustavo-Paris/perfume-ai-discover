-- Função administrativa para limpar perfumes duplicados
CREATE OR REPLACE FUNCTION public.clean_duplicate_perfumes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  -- Deletar duplicatas mantendo apenas o registro mais antigo
  WITH duplicates AS (
    SELECT id, brand, name, 
           ROW_NUMBER() OVER (PARTITION BY brand, name ORDER BY created_at) as rn
    FROM perfumes
  )
  DELETE FROM perfumes 
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Dar permissão para admins executarem a função
GRANT EXECUTE ON FUNCTION public.clean_duplicate_perfumes() TO authenticated;

-- Executar a limpeza
SELECT public.clean_duplicate_perfumes();