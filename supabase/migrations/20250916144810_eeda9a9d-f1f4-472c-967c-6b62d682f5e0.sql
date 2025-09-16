-- Remover campos de preço da tabela perfumes
-- Os preços serão calculados dinamicamente usando função calculate_product_total_cost

ALTER TABLE public.perfumes DROP COLUMN IF EXISTS price_2ml;
ALTER TABLE public.perfumes DROP COLUMN IF EXISTS price_5ml;
ALTER TABLE public.perfumes DROP COLUMN IF EXISTS price_10ml;
ALTER TABLE public.perfumes DROP COLUMN IF EXISTS price_full;

-- Atualizar função para incluir materiais de embalagem no cálculo
CREATE OR REPLACE FUNCTION public.calculate_product_total_cost(perfume_uuid uuid, size_ml_param integer)
RETURNS TABLE(
  perfume_cost_per_unit numeric,
  materials_cost_per_unit numeric,
  packaging_cost_per_unit numeric,
  total_cost_per_unit numeric,
  suggested_price numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  perfume_cost numeric := 0;
  materials_cost numeric := 0;
  packaging_cost numeric := 0;
  margin_percentage numeric := 0.50; -- 50% margem padrão
BEGIN
  -- Obter custo do perfume por ml e margem
  SELECT 
    COALESCE(p.avg_cost_per_ml, 0) * size_ml_param,
    COALESCE(p.target_margin_percentage, 0.50)
  INTO perfume_cost, margin_percentage
  FROM perfumes p 
  WHERE p.id = perfume_uuid;
  
  -- Calcular custo dos materiais de produção
  SELECT COALESCE(SUM(m.cost_per_unit * pr.quantity_needed), 0)
  INTO materials_cost
  FROM product_recipes pr
  JOIN materials m ON pr.material_id = m.id
  WHERE pr.perfume_id = perfume_uuid 
    AND pr.size_ml = size_ml_param
    AND m.type = 'input'
    AND m.is_active = true;
  
  -- Calcular custo de embalagem (frasco + etiqueta)
  SELECT COALESCE(SUM(
    CASE 
      WHEN m.category = 'frasco' AND m.name LIKE '%' || size_ml_param || 'ml%' THEN m.cost_per_unit
      WHEN m.category = 'etiqueta' THEN m.cost_per_unit
      ELSE 0
    END
  ), 0)
  INTO packaging_cost
  FROM materials m
  WHERE m.type = 'packaging'
    AND m.is_active = true
    AND (
      (m.category = 'frasco' AND m.name LIKE '%' || size_ml_param || 'ml%') OR
      (m.category = 'etiqueta')
    );
  
  RETURN QUERY SELECT 
    perfume_cost as perfume_cost_per_unit,
    materials_cost as materials_cost_per_unit,
    packaging_cost as packaging_cost_per_unit,
    (perfume_cost + materials_cost + packaging_cost) as total_cost_per_unit,
    ROUND((perfume_cost + materials_cost + packaging_cost) / (1 - margin_percentage), 2) as suggested_price;
END;
$function$;

-- Criar materiais de embalagem padrão se não existirem
INSERT INTO public.materials (name, type, category, unit, cost_per_unit, description, is_active)
VALUES 
  ('Frasco 2ml', 'packaging', 'frasco', 'unidade', 0.50, 'Frasco de vidro para decants de 2ml', true),
  ('Frasco 5ml', 'packaging', 'frasco', 'unidade', 0.80, 'Frasco de vidro para decants de 5ml', true),
  ('Frasco 10ml', 'packaging', 'frasco', 'unidade', 1.20, 'Frasco de vidro para decants de 10ml', true),
  ('Etiqueta Padrão', 'packaging', 'etiqueta', 'unidade', 0.15, 'Etiqueta adesiva padrão para decants', true)
ON CONFLICT (name) DO NOTHING;