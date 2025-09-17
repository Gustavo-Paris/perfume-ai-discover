-- Atualizar função update_perfume_margin para usar a nova tabela perfume_prices
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
  -- Atualizar margem do perfume (converter porcentagem para decimal)
  UPDATE perfumes 
  SET target_margin_percentage = new_margin_percentage / 100.0
  WHERE id = perfume_uuid;
  
  -- Buscar tamanhos disponíveis das configurações ou usar padrão
  FOR available_size IN 
    SELECT DISTINCT (jsonb_array_elements(bottle_materials)->>'size_ml')::integer as size_ml
    FROM material_configurations
    UNION
    SELECT unnest(ARRAY[2, 5, 10, 20]) as size_ml
  LOOP
    -- Calcular custo para cada tamanho
    SELECT * INTO cost_result FROM calculate_product_total_cost(perfume_uuid, available_size);
    
    -- Salvar preço na tabela perfume_prices
    INSERT INTO perfume_prices (perfume_id, size_ml, price)
    VALUES (perfume_uuid, available_size, cost_result.suggested_price)
    ON CONFLICT (perfume_id, size_ml) 
    DO UPDATE SET 
      price = cost_result.suggested_price,
      updated_at = now();
  END LOOP;
  
END;
$function$;