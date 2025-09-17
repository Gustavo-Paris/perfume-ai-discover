-- Corrigir função de cálculo de preços para usar multiplicador corretamente
CREATE OR REPLACE FUNCTION public.calculate_dynamic_product_costs(perfume_uuid uuid, sizes_array integer[])
RETURNS TABLE(size_ml integer, perfume_cost_per_unit numeric, materials_cost_per_unit numeric, total_cost_per_unit numeric, suggested_price numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  size_ml_param integer;
  perfume_cost numeric := 0;
  materials_cost numeric := 0;
  margin_multiplier numeric := 2.0; -- Default 100% margin (multiplier 2.0)
BEGIN
  -- Get perfume cost per ml and margin multiplier
  SELECT 
    COALESCE(p.avg_cost_per_ml, 0),
    COALESCE(p.target_margin_percentage, 2.0) -- Agora esperamos multiplicador, não porcentagem
  INTO perfume_cost, margin_multiplier
  FROM perfumes p 
  WHERE p.id = perfume_uuid;
  
  -- Loop through each size
  FOREACH size_ml_param IN ARRAY sizes_array
  LOOP
    -- Calculate materials cost for this specific size
    SELECT COALESCE(SUM(m.cost_per_unit * pr.quantity_needed), 0)
    INTO materials_cost
    FROM product_recipes pr
    JOIN materials m ON pr.material_id = m.id
    WHERE pr.perfume_id = perfume_uuid 
      AND pr.size_ml = size_ml_param
      AND m.type = 'input'
      AND m.is_active = true;
    
    -- Return row for this size usando multiplicador (custo × multiplicador = preço)
    RETURN QUERY SELECT 
      size_ml_param as size_ml,
      (perfume_cost * size_ml_param) as perfume_cost_per_unit,
      materials_cost as materials_cost_per_unit,
      ((perfume_cost * size_ml_param) + materials_cost) as total_cost_per_unit,
      ROUND(((perfume_cost * size_ml_param) + materials_cost) * margin_multiplier, 2) as suggested_price;
  END LOOP;
END;
$function$;