-- Corrigir a função de cálculo de preços
CREATE OR REPLACE FUNCTION public.calculate_product_total_cost(
  perfume_uuid uuid, 
  size_ml_param integer
)
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
  frasco_cost numeric := 0;
  etiqueta_cost numeric := 0;
  total_material_cost numeric := 0;
  total_cost_calc numeric := 0;
  margin_multiplier numeric := 2.0;
  suggested_price_calc numeric := 0;
BEGIN
  -- Buscar custo médio por ml e margem do perfume
  SELECT 
    COALESCE(avg_cost_per_ml, 0),
    COALESCE(target_margin_percentage, 2.0)
  INTO perfume_avg_cost, margin_multiplier
  FROM perfumes 
  WHERE id = perfume_uuid;
  
  -- Buscar custo do frasco baseado no tamanho
  IF size_ml_param = 2 THEN
    SELECT COALESCE(cost_per_unit, 2.0)
    INTO frasco_cost
    FROM materials
    WHERE name = 'Frasco 2ml' AND is_active = true
    LIMIT 1;
  ELSIF size_ml_param = 5 THEN
    SELECT COALESCE(cost_per_unit, 4.0)
    INTO frasco_cost
    FROM materials
    WHERE name = 'Frasco 5ml' AND is_active = true
    LIMIT 1;
  ELSIF size_ml_param = 10 THEN
    SELECT COALESCE(cost_per_unit, 5.5)
    INTO frasco_cost
    FROM materials
    WHERE name = 'Frasco 10ml' AND is_active = true
    LIMIT 1;
  ELSIF size_ml_param = 20 THEN
    SELECT COALESCE(cost_per_unit, 8.0)
    INTO frasco_cost
    FROM materials
    WHERE name = 'Frasco 20ml' AND is_active = true
    LIMIT 1;
  ELSIF size_ml_param = 50 THEN
    SELECT COALESCE(cost_per_unit, 15.0)
    INTO frasco_cost
    FROM materials
    WHERE name = 'Frasco 50ml' AND is_active = true
    LIMIT 1;
  ELSE
    -- Para outros tamanhos, usar frasco 10ml como padrão
    frasco_cost := 5.5;
  END IF;
  
  -- Buscar custo da etiqueta
  SELECT COALESCE(cost_per_unit, 0.27)
  INTO etiqueta_cost
  FROM materials
  WHERE name = 'Etiqueta Padrão' AND is_active = true
  LIMIT 1;
  
  -- Calcular custo total dos materiais
  total_material_cost := frasco_cost + etiqueta_cost;
  
  -- Calcular custo total do produto
  total_cost_calc := (perfume_avg_cost * size_ml_param) + total_material_cost;
  
  -- Aplicar margem (multiplicador direto)
  IF total_cost_calc > 0 THEN
    suggested_price_calc := total_cost_calc * margin_multiplier;
  END IF;
  
  RETURN QUERY SELECT 
    perfume_avg_cost,
    total_material_cost,
    total_cost_calc,
    ROUND(suggested_price_calc, 2);
END;
$$;