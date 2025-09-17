-- Corrigir função update_perfume_margin - NÃO dividir por 100 pois já vem correto
CREATE OR REPLACE FUNCTION public.update_perfume_margin(perfume_uuid uuid, new_margin_percentage numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cost_result RECORD;
  available_size INTEGER;
BEGIN
  -- CORRIGIDO: Atualizar margem sem dividir por 100 (valor já vem correto como decimal)
  UPDATE perfumes 
  SET target_margin_percentage = new_margin_percentage
  WHERE id = perfume_uuid;
  
  -- Buscar tamanhos disponíveis das configurações ou usar padrão
  FOR available_size IN 
    SELECT DISTINCT (jsonb_array_elements(bottle_materials)->>'size_ml')::integer as size_ml
    FROM material_configurations
    WHERE bottle_materials IS NOT NULL
    UNION
    SELECT unnest(ARRAY[2, 5, 10, 20]) as size_ml
    ORDER BY size_ml
  LOOP
    -- Calcular custo para cada tamanho
    SELECT * INTO cost_result FROM calculate_product_total_cost(perfume_uuid, available_size);
    
    IF cost_result.suggested_price IS NOT NULL AND cost_result.suggested_price > 0 THEN
      -- Salvar preço na tabela perfume_prices
      INSERT INTO perfume_prices (perfume_id, size_ml, price)
      VALUES (perfume_uuid, available_size, cost_result.suggested_price)
      ON CONFLICT (perfume_id, size_ml) 
      DO UPDATE SET 
        price = cost_result.suggested_price,
        updated_at = now();
    END IF;
  END LOOP;
  
END;
$function$;