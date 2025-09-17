-- Corrigir função update_perfume_margin para remover referência à coluna updated_at que não existe

CREATE OR REPLACE FUNCTION public.update_perfume_margin(perfume_uuid uuid, new_margin_percentage numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result_data jsonb;
  available_sizes integer[];
  size_record integer;
  price_result record;
BEGIN
  -- Atualizar margem do perfume (removendo updated_at que não existe)
  UPDATE perfumes 
  SET target_margin_percentage = new_margin_percentage
  WHERE id = perfume_uuid;
  
  -- Verificar se a atualização foi bem-sucedida
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfume não encontrado: %', perfume_uuid;
  END IF;
  
  -- Buscar tamanhos disponíveis das configurações de materiais
  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT (jsonb_array_elements_text(bottle_materials)::jsonb->>'size_ml')::integer
      FROM material_configurations 
      WHERE bottle_materials IS NOT NULL 
        AND jsonb_array_length(bottle_materials) > 0
    ), 
    ARRAY[5, 10, 50] -- fallback padrão
  ) INTO available_sizes;
  
  -- Recalcular preços para todos os tamanhos disponíveis
  FOR size_record IN SELECT unnest(available_sizes)
  LOOP
    -- Calcular novo custo e preço
    SELECT * INTO price_result 
    FROM calculate_product_total_cost(perfume_uuid, size_record);
    
    -- Definir preço calculado
    IF price_result.suggested_price IS NOT NULL THEN
      PERFORM set_perfume_price(perfume_uuid, size_record, price_result.suggested_price);
    END IF;
  END LOOP;
  
  -- Retornar informações de sucesso
  result_data := jsonb_build_object(
    'success', true,
    'perfume_id', perfume_uuid,
    'new_margin', new_margin_percentage,
    'updated_sizes', available_sizes,
    'message', 'Margem atualizada e preços recalculados com sucesso'
  );
  
  RETURN result_data;
END;
$function$;