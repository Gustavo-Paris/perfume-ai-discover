-- Atualizar a função de recálculo de preços
CREATE OR REPLACE FUNCTION public.recalculate_all_perfume_prices()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  perfume_record RECORD;
  size_text text;
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
    FOR size_text IN
      SELECT jsonb_array_elements_text(perfume_record.available_sizes::jsonb)
    LOOP
      BEGIN
        size_int := size_text::integer;
        
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
      EXCEPTION 
        WHEN OTHERS THEN
          -- Continuar se houver erro em um perfume específico
          CONTINUE;
      END;
    END LOOP;
  END LOOP;
  
  RETURN updated_count;
END;
$$;

-- Executar recálculo de todos os preços
SELECT recalculate_all_perfume_prices();