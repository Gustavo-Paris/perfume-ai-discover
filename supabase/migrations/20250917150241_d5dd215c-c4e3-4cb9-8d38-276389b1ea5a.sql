-- Corrigir função para aceitar frascos como embalagem
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
  -- Buscar margem do perfume
  SELECT target_margin_percentage INTO perfume_margin
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
  
  -- CORRIGIR: Buscar frasco adequado para o tamanho (não mais embalagem genérica)
  SELECT 
    m.name,
    m.cost_per_unit,
    m.cost_per_unit as item_cost
  INTO packaging_record
  FROM materials m
  WHERE m.type = 'input' 
    AND m.category = 'frasco'
    AND m.is_active = true
    AND m.name LIKE '%' || size_ml_param || 'ml%'
  ORDER BY m.cost_per_unit ASC
  LIMIT 1;
  
  -- Se não encontrou frasco específico, usar qualquer frasco
  IF packaging_record IS NULL THEN
    SELECT 
      m.name,
      m.cost_per_unit,
      m.cost_per_unit as item_cost
    INTO packaging_record
    FROM materials m
    WHERE m.type = 'input' 
      AND (m.category = 'frasco' OR m.category = 'embalagem')
      AND m.is_active = true
    ORDER BY m.cost_per_unit ASC
    LIMIT 1;
  END IF;
  
  -- Adicionar custo da embalagem/frasco se encontrado
  IF packaging_record IS NOT NULL THEN
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
  END IF;
  
  -- Se não há receita, usar custo médio do perfume como fallback
  IF total_material_cost = 0 THEN
    SELECT COALESCE(avg_cost_per_ml, 0) * size_ml_param
    INTO total_material_cost
    FROM perfumes
    WHERE id = perfume_uuid;
  END IF;
  
  RETURN QUERY SELECT 
    perfume_uuid as perfume_id,
    size_ml_param as size_ml,
    (total_material_cost + packaging_cost) as total_cost_per_unit,
    -- Preço = Custo × Multiplicador
    (total_material_cost + packaging_cost) * perfume_margin as suggested_price,
    perfume_margin as margin_percentage,
    cost_detail as cost_breakdown;
END;
$function$;