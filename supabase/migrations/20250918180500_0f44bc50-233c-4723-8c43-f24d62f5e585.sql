-- Remover função existente e recriar com assinatura correta
DROP FUNCTION IF EXISTS public.calculate_product_total_cost(uuid, integer);

-- Função para calcular custo total do produto (perfume + materiais)
CREATE OR REPLACE FUNCTION public.calculate_product_total_cost(perfume_uuid uuid, size_ml_param integer)
RETURNS TABLE(
  perfume_cost_per_ml numeric,
  material_cost_per_unit numeric,
  total_cost_per_unit numeric,
  suggested_price numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  perfume_avg_cost numeric := 0;
  material_cost numeric := 0;
  total_cost numeric := 0;
  margin_percentage numeric := 80;
  suggested_price_calc numeric := 0;
BEGIN
  -- Buscar custo médio por ml do perfume
  SELECT COALESCE(avg_cost_per_ml, 0), COALESCE(target_margin_percentage, 80)
  INTO perfume_avg_cost, margin_percentage
  FROM perfumes 
  WHERE id = perfume_uuid;
  
  -- Buscar custo dos materiais (frasco + etiqueta) para o tamanho específico
  SELECT COALESCE(SUM(m.cost_per_unit), 0)
  INTO material_cost
  FROM material_configurations mc
  CROSS JOIN jsonb_array_elements(mc.bottle_materials) AS bottle_mat
  JOIN materials m ON m.id = (bottle_mat->>'material_id')::uuid
  WHERE (bottle_mat->>'size_ml')::integer = size_ml_param
    AND m.is_active = true;
    
  -- Se não encontrou material para o tamanho específico, usar etiqueta padrão
  IF material_cost = 0 THEN
    SELECT COALESCE(cost_per_unit, 0)
    INTO material_cost
    FROM materials
    WHERE name ILIKE '%etiqueta%' 
      AND is_active = true
    LIMIT 1;
  END IF;
  
  -- Calcular custo total
  total_cost := (perfume_avg_cost * size_ml_param) + material_cost;
  
  -- Calcular preço sugerido com margem
  IF total_cost > 0 THEN
    suggested_price_calc := total_cost * (1 + (margin_percentage / 100));
  END IF;
  
  RETURN QUERY SELECT 
    perfume_avg_cost,
    material_cost,
    total_cost,
    ROUND(suggested_price_calc, 2);
END;
$$;