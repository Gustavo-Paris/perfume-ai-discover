-- Remover função existente e recriar
DROP FUNCTION IF EXISTS public.recalculate_all_perfume_prices();

-- Criar função corrigida
CREATE OR REPLACE FUNCTION public.recalculate_all_perfume_prices()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  perfume_record RECORD;
  size_int integer;
  calc_result RECORD;
  updated_count integer := 0;
BEGIN
  -- Para cada perfume
  FOR perfume_record IN 
    SELECT id, available_sizes 
    FROM perfumes 
    WHERE available_sizes IS NOT NULL
  LOOP
    -- Para cada tamanho disponível
    IF perfume_record.available_sizes IS NOT NULL THEN
      DECLARE
        size_value text;
      BEGIN
        -- Iterar sobre os tamanhos disponíveis
        FOR size_value IN
          SELECT jsonb_array_elements_text(perfume_record.available_sizes::jsonb)
        LOOP
          size_int := size_value::integer;
          
          -- Calcular custo e preço para este tamanho
          SELECT * INTO calc_result 
          FROM calculate_product_total_cost(perfume_record.id, size_int);
          
          -- Atualizar o preço correspondente
          IF size_int = 2 THEN
            UPDATE perfumes SET price_2ml = calc_result.suggested_price WHERE id = perfume_record.id;
          ELSIF size_int = 5 THEN
            UPDATE perfumes SET price_5ml = calc_result.suggested_price WHERE id = perfume_record.id;
          ELSIF size_int = 10 THEN
            UPDATE perfumes SET price_10ml = calc_result.suggested_price WHERE id = perfume_record.id;
          ELSIF size_int IN (20, 30, 50, 100) THEN
            UPDATE perfumes SET price_full = calc_result.suggested_price WHERE id = perfume_record.id;
          END IF;
          
          updated_count := updated_count + 1;
        END LOOP;
      END;
    END IF;
  END LOOP;
  
  RETURN updated_count;
END;
$$;

-- Executar recálculo
SELECT recalculate_all_perfume_prices();