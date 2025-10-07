-- ============================================
-- Correção Final de Segurança: View e Function
-- ============================================

-- 1. Corrigir perfumes_public view - forçar security_invoker
DROP VIEW IF EXISTS public.perfumes_public CASCADE;

CREATE VIEW public.perfumes_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  brand,
  name,
  description,
  family,
  gender,
  top_notes,
  heart_notes,
  base_notes,
  price_5ml,
  price_10ml,
  price_full,
  price_2ml,
  image_url,
  category,
  created_at,
  product_type,
  source_size_ml,
  available_sizes
FROM perfumes
WHERE id IS NOT NULL; -- Public view - todos os perfumes visíveis

ALTER VIEW public.perfumes_public OWNER TO postgres;

-- 2. Corrigir função de trigger - adicionar search_path fixo
CREATE OR REPLACE FUNCTION public.auto_recalculate_perfume_prices()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  sizes INTEGER[] := ARRAY[2, 5, 10];
  size_val INTEGER;
  perfume_cost NUMERIC;
  packaging_cost NUMERIC;
  total_cost NUMERIC;
  margin_rate NUMERIC;
  suggested_price NUMERIC;
  perfume_margin NUMERIC;
  
  -- Custos dos materiais
  frasco_2ml_cost NUMERIC := 0.50;
  frasco_5ml_cost NUMERIC := 0.80;
  frasco_10ml_cost NUMERIC := 1.20;
  etiqueta_cost NUMERIC := 0.15;
BEGIN
  -- Buscar margem do perfume (padrão 2.0 = 100% se não definida)
  SELECT COALESCE(target_margin_percentage, 2.0) 
  INTO perfume_margin
  FROM perfumes 
  WHERE id = COALESCE(NEW.perfume_id, OLD.perfume_id);
  
  -- Atualizar custo médio do perfume primeiro
  PERFORM update_perfume_avg_cost(COALESCE(NEW.perfume_id, OLD.perfume_id));
  
  -- Buscar custos reais dos materiais se existirem
  BEGIN
    SELECT COALESCE(cost_per_unit, 0.50) INTO frasco_2ml_cost 
    FROM materials WHERE name = 'Frasco 2ml' AND is_active = true LIMIT 1;
    
    SELECT COALESCE(cost_per_unit, 0.80) INTO frasco_5ml_cost 
    FROM materials WHERE name = 'Frasco 5ml' AND is_active = true LIMIT 1;
    
    SELECT COALESCE(cost_per_unit, 1.20) INTO frasco_10ml_cost 
    FROM materials WHERE name = 'Frasco 10ml' AND is_active = true LIMIT 1;
    
    SELECT COALESCE(cost_per_unit, 0.15) INTO etiqueta_cost 
    FROM materials WHERE name = 'Etiqueta Padrão' AND is_active = true LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    -- Se houver erro na busca de materiais, usar valores padrão
    NULL;
  END;
  
  -- perfume_margin JÁ É UM MULTIPLICADOR
  margin_rate := perfume_margin;
  
  -- Para cada tamanho
  FOREACH size_val IN ARRAY sizes
  LOOP
    -- Buscar custo do perfume por ml
    SELECT COALESCE(avg_cost_per_ml, 0) INTO perfume_cost
    FROM perfumes 
    WHERE id = COALESCE(NEW.perfume_id, OLD.perfume_id);
    
    -- Determinar custo da embalagem baseado no tamanho
    IF size_val = 2 THEN
      packaging_cost := frasco_2ml_cost + etiqueta_cost;
    ELSIF size_val = 5 THEN
      packaging_cost := frasco_5ml_cost + etiqueta_cost;
    ELSIF size_val = 10 THEN
      packaging_cost := frasco_10ml_cost + etiqueta_cost;
    ELSE
      packaging_cost := frasco_10ml_cost + etiqueta_cost;
    END IF;
    
    -- Calcular custo total
    total_cost := (perfume_cost * size_val) + packaging_cost;
    
    -- Aplicar margem
    suggested_price := total_cost * margin_rate;
    
    -- Arredondar para 2 casas decimais
    suggested_price := ROUND(suggested_price, 2);
    
    -- Atualizar preço baseado no tamanho
    IF size_val = 2 THEN
      UPDATE perfumes 
      SET price_2ml = suggested_price
      WHERE id = COALESCE(NEW.perfume_id, OLD.perfume_id);
    ELSIF size_val = 5 THEN
      UPDATE perfumes 
      SET price_5ml = suggested_price
      WHERE id = COALESCE(NEW.perfume_id, OLD.perfume_id);
    ELSIF size_val = 10 THEN
      UPDATE perfumes 
      SET price_10ml = suggested_price
      WHERE id = COALESCE(NEW.perfume_id, OLD.perfume_id);
    END IF;
    
  END LOOP;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;