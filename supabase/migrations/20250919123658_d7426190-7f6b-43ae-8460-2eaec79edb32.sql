-- Verificar se a função recalculate_perfume_prices_after_material_change existe
-- Se não existir, criar uma versão completa

CREATE OR REPLACE FUNCTION public.recalculate_all_perfume_prices()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  perfume_record RECORD;
  size_record INTEGER;
  cost_result RECORD;
  updated_count INTEGER := 0;
  error_count INTEGER := 0;
  sizes INTEGER[] := ARRAY[2, 5, 10, 50];
BEGIN
  -- Para cada perfume que existe
  FOR perfume_record IN 
    SELECT id, name, target_margin_percentage 
    FROM perfumes
    ORDER BY name
  LOOP
    BEGIN
      -- Para cada tamanho
      FOREACH size_record IN ARRAY sizes
      LOOP
        -- Calcular custo total para este perfume e tamanho
        SELECT * INTO cost_result 
        FROM calculate_product_total_cost(perfume_record.id, size_record);
        
        -- Se conseguiu calcular um preço válido, salvar
        IF cost_result.suggested_price > 0 THEN
          -- Atualizar na tabela perfume_prices
          INSERT INTO perfume_prices (perfume_id, size_ml, price)
          VALUES (perfume_record.id, size_record, cost_result.suggested_price)
          ON CONFLICT (perfume_id, size_ml)
          DO UPDATE SET 
            price = cost_result.suggested_price,
            updated_at = now();
          
          -- Atualizar também as colunas legadas na tabela perfumes para compatibilidade
          IF size_record = 2 THEN
            UPDATE perfumes 
            SET price_2ml = cost_result.suggested_price
            WHERE id = perfume_record.id;
          ELSIF size_record = 5 THEN
            UPDATE perfumes 
            SET price_5ml = cost_result.suggested_price
            WHERE id = perfume_record.id;
          ELSIF size_record = 10 THEN
            UPDATE perfumes 
            SET price_10ml = cost_result.suggested_price
            WHERE id = perfume_record.id;
          ELSIF size_record = 50 THEN
            UPDATE perfumes 
            SET price_full = cost_result.suggested_price
            WHERE id = perfume_record.id;
          END IF;
        END IF;
      END LOOP;
      
      updated_count := updated_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE LOG 'Erro ao recalcular perfume %: %', perfume_record.name, SQLERRM;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_perfumes', updated_count,
    'errors', error_count,
    'message', format('Preços recalculados para %s perfumes (erros: %s)', updated_count, error_count)
  );
END;
$function$;

-- Garantir que a função recalculate_perfume_prices_after_material_change existe
CREATE OR REPLACE FUNCTION public.recalculate_perfume_prices_after_material_change()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Simplesmente chamar a função principal de recálculo
  PERFORM recalculate_all_perfume_prices();
END;
$function$;