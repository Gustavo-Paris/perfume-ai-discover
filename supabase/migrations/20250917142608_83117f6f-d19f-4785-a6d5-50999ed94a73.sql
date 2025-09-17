-- Corrigir função calculate_product_total_cost para evitar divisão por zero
CREATE OR REPLACE FUNCTION public.calculate_product_total_cost(perfume_uuid uuid, size_ml_param integer)
RETURNS TABLE(perfume_cost_per_unit numeric, materials_cost_per_unit numeric, total_cost_per_unit numeric, suggested_price numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  perfume_cost numeric := 0;
  materials_cost numeric := 0;
  margin_percentage numeric := 0.50;
  denominator numeric;
BEGIN
  -- Get perfume cost per ml and margin
  SELECT 
    COALESCE(p.avg_cost_per_ml, 0) * size_ml_param,
    COALESCE(p.target_margin_percentage, 0.50)
  INTO perfume_cost, margin_percentage
  FROM perfumes p 
  WHERE p.id = perfume_uuid;
  
  -- Calculate materials cost
  SELECT COALESCE(SUM(m.cost_per_unit * pr.quantity_needed), 0)
  INTO materials_cost
  FROM product_recipes pr
  JOIN materials m ON pr.material_id = m.id
  WHERE pr.perfume_id = perfume_uuid 
    AND pr.size_ml = size_ml_param
    AND m.type = 'input'
    AND m.is_active = true;
  
  -- Calcular denominador para evitar divisão por zero
  denominator := 1 - margin_percentage;
  
  -- Se a margem for >= 100% (denominador <= 0), usar margem padrão de 50%
  IF denominator <= 0 THEN
    denominator := 0.5; -- 1 - 0.5 = 0.5 (margem de 50%)
    margin_percentage := 0.5;
  END IF;
  
  RETURN QUERY SELECT 
    perfume_cost as perfume_cost_per_unit,
    materials_cost as materials_cost_per_unit,
    (perfume_cost + materials_cost) as total_cost_per_unit,
    ROUND((perfume_cost + materials_cost) / denominator, 2) as suggested_price;
END;
$function$;