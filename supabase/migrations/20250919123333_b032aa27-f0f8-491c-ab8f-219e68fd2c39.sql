-- Melhorar o trigger de material_lots para recalcular materiais E perfumes
CREATE OR REPLACE FUNCTION public.trigger_material_cost_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Recalcular custo do material afetado
    PERFORM update_material_avg_cost(NEW.material_id);
    -- Recalcular TODOS os preços dos perfumes que podem usar este material
    PERFORM recalculate_perfume_prices_after_material_change();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Recalcular custo do material afetado
    PERFORM update_material_avg_cost(OLD.material_id);
    -- Recalcular TODOS os preços dos perfumes que podem usar este material
    PERFORM recalculate_perfume_prices_after_material_change();
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Melhorar o trigger de inventory_lots para recalcular perfumes automaticamente
CREATE OR REPLACE FUNCTION public.trigger_update_avg_cost()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  sizes INTEGER[] := ARRAY[2, 5, 10, 50];
  size_val INTEGER;
  cost_result RECORD;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Atualizar custo médio do perfume
    PERFORM update_perfume_avg_cost(NEW.perfume_id);
    
    -- Recalcular preços para todos os tamanhos deste perfume específico
    FOREACH size_val IN ARRAY sizes
    LOOP
      -- Calcular custo total para este perfume e tamanho
      SELECT * INTO cost_result 
      FROM calculate_product_total_cost(NEW.perfume_id, size_val);
      
      -- Se conseguiu calcular um preço válido, atualizar
      IF cost_result.suggested_price > 0 THEN
        -- Atualizar na tabela perfume_prices
        INSERT INTO perfume_prices (perfume_id, size_ml, price)
        VALUES (NEW.perfume_id, size_val, cost_result.suggested_price)
        ON CONFLICT (perfume_id, size_ml)
        DO UPDATE SET 
          price = cost_result.suggested_price,
          updated_at = now();
        
        -- Atualizar também as colunas legadas na tabela perfumes para compatibilidade
        IF size_val = 2 THEN
          UPDATE perfumes 
          SET price_2ml = cost_result.suggested_price
          WHERE id = NEW.perfume_id;
        ELSIF size_val = 5 THEN
          UPDATE perfumes 
          SET price_5ml = cost_result.suggested_price
          WHERE id = NEW.perfume_id;
        ELSIF size_val = 10 THEN
          UPDATE perfumes 
          SET price_10ml = cost_result.suggested_price
          WHERE id = NEW.perfume_id;
        ELSIF size_val = 50 THEN
          UPDATE perfumes 
          SET price_full = cost_result.suggested_price
          WHERE id = NEW.perfume_id;
        END IF;
      END IF;
    END LOOP;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Atualizar custo médio do perfume
    PERFORM update_perfume_avg_cost(OLD.perfume_id);
    
    -- Recalcular preços para todos os tamanhos deste perfume específico
    FOREACH size_val IN ARRAY sizes
    LOOP
      -- Calcular custo total para este perfume e tamanho
      SELECT * INTO cost_result 
      FROM calculate_product_total_cost(OLD.perfume_id, size_val);
      
      -- Se conseguiu calcular um preço válido, atualizar
      IF cost_result.suggested_price > 0 THEN
        -- Atualizar na tabela perfume_prices
        INSERT INTO perfume_prices (perfume_id, size_ml, price)
        VALUES (OLD.perfume_id, size_val, cost_result.suggested_price)
        ON CONFLICT (perfume_id, size_ml)
        DO UPDATE SET 
          price = cost_result.suggested_price,
          updated_at = now();
        
        -- Atualizar também as colunas legadas na tabela perfumes para compatibilidade
        IF size_val = 2 THEN
          UPDATE perfumes 
          SET price_2ml = cost_result.suggested_price
          WHERE id = OLD.perfume_id;
        ELSIF size_val = 5 THEN
          UPDATE perfumes 
          SET price_5ml = cost_result.suggested_price
          WHERE id = OLD.perfume_id;
        ELSIF size_val = 10 THEN
          UPDATE perfumes 
          SET price_10ml = cost_result.suggested_price
          WHERE id = OLD.perfume_id;
        ELSIF size_val = 50 THEN
          UPDATE perfumes 
          SET price_full = cost_result.suggested_price
          WHERE id = OLD.perfume_id;
        END IF;
      END IF;
    END LOOP;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Recriar os triggers
DROP TRIGGER IF EXISTS trigger_update_material_cost ON material_lots;
CREATE TRIGGER trigger_update_material_cost
  AFTER INSERT OR UPDATE OR DELETE ON material_lots
  FOR EACH ROW
  EXECUTE FUNCTION trigger_material_cost_update();

DROP TRIGGER IF EXISTS trigger_update_avg_cost ON inventory_lots;
CREATE TRIGGER trigger_update_avg_cost
  AFTER INSERT OR UPDATE OR DELETE ON inventory_lots
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_avg_cost();

-- Garantir que o trigger de recálculo automático dos perfumes também funciona
DROP TRIGGER IF EXISTS auto_recalculate_perfume_prices ON inventory_lots;
CREATE TRIGGER auto_recalculate_perfume_prices
  AFTER INSERT OR UPDATE OR DELETE ON inventory_lots
  FOR EACH ROW
  EXECUTE FUNCTION auto_recalculate_perfume_prices();