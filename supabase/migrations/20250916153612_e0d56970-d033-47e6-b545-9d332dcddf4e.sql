-- Corrigir a função auto_recalculate_perfume_prices que está causando erro
CREATE OR REPLACE FUNCTION public.auto_recalculate_perfume_prices()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  -- Buscar margem do perfume (padrão 50% se não definida)
  SELECT COALESCE(target_margin_percentage, 50) 
  INTO perfume_margin
  FROM perfumes 
  WHERE id = COALESCE(NEW.perfume_id, OLD.perfume_id);
  
  -- Atualizar custo médio do perfume primeiro
  PERFORM public.update_perfume_avg_cost(COALESCE(NEW.perfume_id, OLD.perfume_id));
  
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
  
  margin_rate := 1 + (perfume_margin / 100);
  
  -- Recalcular preços para cada tamanho
  FOREACH size_val IN ARRAY sizes
  LOOP
    -- Buscar custo médio do perfume por ml
    SELECT COALESCE(avg_cost_per_ml, 0) INTO perfume_cost
    FROM perfumes 
    WHERE id = COALESCE(NEW.perfume_id, OLD.perfume_id);
    
    perfume_cost := perfume_cost * size_val;
    
    -- Calcular custo da embalagem baseado no tamanho
    packaging_cost := CASE 
      WHEN size_val = 2 THEN frasco_2ml_cost + etiqueta_cost
      WHEN size_val = 5 THEN frasco_5ml_cost + etiqueta_cost
      WHEN size_val = 10 THEN frasco_10ml_cost + etiqueta_cost
      ELSE frasco_5ml_cost + etiqueta_cost
    END;
    
    total_cost := perfume_cost + packaging_cost;
    suggested_price := ROUND(total_cost * margin_rate, 2);
    
    -- Atualizar preço na tabela perfumes
    IF size_val = 2 THEN
      UPDATE perfumes SET price_2ml = suggested_price 
      WHERE id = COALESCE(NEW.perfume_id, OLD.perfume_id);
    ELSIF size_val = 5 THEN
      UPDATE perfumes SET price_5ml = suggested_price 
      WHERE id = COALESCE(NEW.perfume_id, OLD.perfume_id);
    ELSIF size_val = 10 THEN
      UPDATE perfumes SET price_10ml = suggested_price 
      WHERE id = COALESCE(NEW.perfume_id, OLD.perfume_id);
    END IF;
  END LOOP;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;