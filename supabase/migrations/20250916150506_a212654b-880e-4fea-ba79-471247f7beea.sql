-- 1. Adicionar coluna target_margin_percentage na tabela perfumes se não existir
ALTER TABLE public.perfumes 
ADD COLUMN IF NOT EXISTS target_margin_percentage NUMERIC DEFAULT 200;

-- 2. Criar trigger para recalcular preços automaticamente quando lote é criado/atualizado
CREATE OR REPLACE FUNCTION public.auto_recalculate_perfume_prices()
RETURNS TRIGGER AS $$
DECLARE
  sizes INTEGER[] := ARRAY[2, 5, 10];
  size_val INTEGER;
  perfume_cost NUMERIC;
  packaging_cost NUMERIC;
  total_cost NUMERIC;
  margin_rate NUMERIC;
  suggested_price NUMERIC;
  perfume_margin NUMERIC;
BEGIN
  -- Buscar margem do perfume (padrão 200% se não definida)
  SELECT COALESCE(target_margin_percentage, 200) 
  INTO perfume_margin
  FROM perfumes 
  WHERE id = COALESCE(NEW.perfume_id, OLD.perfume_id);
  
  -- Atualizar custo médio do perfume primeiro
  PERFORM public.update_perfume_avg_cost(COALESCE(NEW.perfume_id, OLD.perfume_id));
  
  -- Buscar materiais de embalagem
  DECLARE
    frasco_2ml_cost NUMERIC := 0.50;
    frasco_5ml_cost NUMERIC := 0.80;
    frasco_10ml_cost NUMERIC := 1.20;
    etiqueta_cost NUMERIC := 0.15;
  BEGIN
    -- Buscar custos reais dos materiais
    SELECT COALESCE(cost_per_unit, 0.50) INTO frasco_2ml_cost 
    FROM materials WHERE name = 'Frasco 2ml' AND is_active = true;
    
    SELECT COALESCE(cost_per_unit, 0.80) INTO frasco_5ml_cost 
    FROM materials WHERE name = 'Frasco 5ml' AND is_active = true;
    
    SELECT COALESCE(cost_per_unit, 1.20) INTO frasco_10ml_cost 
    FROM materials WHERE name = 'Frasco 10ml' AND is_active = true;
    
    SELECT COALESCE(cost_per_unit, 0.15) INTO etiqueta_cost 
    FROM materials WHERE name = 'Etiqueta Padrão' AND is_active = true;
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
$$ LANGUAGE plpgsql;

-- 3. Criar trigger que executa após INSERT/UPDATE/DELETE em inventory_lots
DROP TRIGGER IF EXISTS trigger_auto_recalculate_prices ON public.inventory_lots;
CREATE TRIGGER trigger_auto_recalculate_prices
    AFTER INSERT OR UPDATE OR DELETE ON public.inventory_lots
    FOR EACH ROW 
    EXECUTE FUNCTION public.auto_recalculate_perfume_prices();

-- 4. Criar função para atualizar margem de um perfume e recalcular preços
CREATE OR REPLACE FUNCTION public.update_perfume_margin(perfume_uuid UUID, new_margin_percentage NUMERIC)
RETURNS BOOLEAN AS $$
BEGIN
  -- Atualizar margem
  UPDATE perfumes 
  SET target_margin_percentage = new_margin_percentage 
  WHERE id = perfume_uuid;
  
  -- Simular trigger para recalcular preços
  PERFORM public.auto_recalculate_perfume_prices() FROM inventory_lots WHERE perfume_id = perfume_uuid LIMIT 1;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;