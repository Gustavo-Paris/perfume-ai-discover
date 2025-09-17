-- Corrigir a função calculate_product_total_cost para usar multiplicador direto
CREATE OR REPLACE FUNCTION public.calculate_product_total_cost(perfume_uuid uuid, size_ml_param integer)
RETURNS TABLE(
  perfume_id uuid,
  size_ml integer,
  total_cost_per_unit numeric,
  suggested_price numeric,
  margin_percentage numeric,
  cost_breakdown jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  perfume_margin numeric;
  total_material_cost numeric := 0;
  packaging_cost numeric := 0;
  cost_detail jsonb := '{"materials": [], "packaging": []}';
  material_record record;
  packaging_record record;
BEGIN
  -- Buscar margem do perfume (já armazenada como multiplicador)
  SELECT target_margin INTO perfume_margin
  FROM perfumes 
  WHERE id = perfume_uuid;
  
  -- Usar margem padrão se não encontrada
  IF perfume_margin IS NULL OR perfume_margin <= 0 THEN
    perfume_margin := 2.0; -- 100% markup = 2.0 multiplier
  END IF;
  
  -- Calcular custo dos materiais da receita
  FOR material_record IN
    SELECT 
      pr.quantity_needed,
      m.name,
      m.cost_per_unit,
      m.unit,
      (pr.quantity_needed * m.cost_per_unit) as item_cost
    FROM product_recipes pr
    JOIN materials m ON pr.material_id = m.id
    WHERE pr.perfume_id = perfume_uuid 
      AND pr.size_ml = size_ml_param
      AND m.is_active = true
  LOOP
    total_material_cost := total_material_cost + material_record.item_cost;
    
    cost_detail := jsonb_set(
      cost_detail,
      '{materials}',
      (cost_detail->'materials') || jsonb_build_object(
        'name', material_record.name,
        'quantity', material_record.quantity_needed,
        'unit_cost', material_record.cost_per_unit,
        'total_cost', material_record.item_cost,
        'unit', material_record.unit
      )
    );
  END LOOP;
  
  -- Calcular custo de embalagem
  FOR packaging_record IN
    SELECT 
      m.name,
      m.cost_per_unit,
      m.cost_per_unit as item_cost
    FROM materials m
    WHERE m.type = 'input' 
      AND m.category = 'embalagem'
      AND m.is_active = true
    ORDER BY m.cost_per_unit DESC
    LIMIT 1
  LOOP
    packaging_cost := packaging_record.item_cost;
    
    cost_detail := jsonb_set(
      cost_detail,
      '{packaging}',
      (cost_detail->'packaging') || jsonb_build_object(
        'name', packaging_record.name,
        'unit_cost', packaging_record.cost_per_unit,
        'total_cost', packaging_record.item_cost
      )
    );
  END LOOP;
  
  RETURN QUERY SELECT 
    perfume_uuid as perfume_id,
    size_ml_param as size_ml,
    (total_material_cost + packaging_cost) as total_cost_per_unit,
    -- CORREÇÃO: Usar multiplicador direto ao invés de fórmula complexa
    -- Preço = Custo × Multiplicador
    (total_material_cost + packaging_cost) * perfume_margin as suggested_price,
    perfume_margin as margin_percentage,
    cost_detail as cost_breakdown;
END;
$function$;

-- Corrigir a função update_perfume_margin para garantir que aceita multiplicador
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
  -- Atualizar margem do perfume (new_margin_percentage já vem como multiplicador)
  UPDATE perfumes 
  SET 
    target_margin = new_margin_percentage,
    updated_at = now()
  WHERE id = perfume_uuid;
  
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