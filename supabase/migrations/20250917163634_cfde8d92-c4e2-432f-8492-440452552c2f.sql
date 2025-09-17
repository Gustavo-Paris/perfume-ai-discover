-- Corrigir sistema de recálculo automático de preços quando materiais mudam

-- 1. Criar função para recalcular preços de perfumes quando materiais mudam
CREATE OR REPLACE FUNCTION public.recalculate_perfume_prices_after_material_change()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  perfume_record RECORD;
  size_record RECORD;
  cost_result RECORD;
  price_id uuid;
BEGIN
  -- Para cada perfume que existe
  FOR perfume_record IN 
    SELECT DISTINCT id, target_margin_percentage 
    FROM perfumes
  LOOP
    -- Para cada tamanho que existe em material_configurations
    FOR size_record IN
      SELECT size_ml 
      FROM (
        SELECT DISTINCT (jsonb_array_elements(bottle_materials)->>'size_ml')::integer AS size_ml
        FROM material_configurations
        WHERE bottle_materials IS NOT NULL
        UNION
        SELECT DISTINCT size_ml FROM perfume_prices WHERE perfume_id = perfume_record.id
      ) sizes
      ORDER BY size_ml
    LOOP
      -- Calcular custo total para este perfume e tamanho
      SELECT * INTO cost_result 
      FROM calculate_product_total_cost(perfume_record.id, size_record.size_ml);
      
      -- Se conseguiu calcular um preço válido, salvar na tabela
      IF cost_result.suggested_price > 0 THEN
        -- Inserir ou atualizar preço na tabela perfume_prices
        INSERT INTO perfume_prices (perfume_id, size_ml, price)
        VALUES (perfume_record.id, size_record.size_ml, cost_result.suggested_price)
        ON CONFLICT (perfume_id, size_ml)
        DO UPDATE SET 
          price = cost_result.suggested_price,
          updated_at = now();
      END IF;
    END LOOP;
  END LOOP;
  
  RAISE LOG 'Preços de perfumes recalculados automaticamente';
END;
$function$;

-- 2. Criar trigger function otimizada
CREATE OR REPLACE FUNCTION public.trigger_recalculate_on_material_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Recalcular preços após pequeno delay para evitar múltiplas execuções
  PERFORM pg_notify('material_cost_changed', '');
  
  -- Executar recálculo imediatamente
  PERFORM recalculate_perfume_prices_after_material_change();
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 3. Remover triggers antigos e criar novos otimizados
DROP TRIGGER IF EXISTS recalculate_on_material_change ON materials;
DROP TRIGGER IF EXISTS trigger_materials_price_recalc ON materials;
DROP TRIGGER IF EXISTS trigger_material_lots_avg_cost ON material_lots;

-- 4. Criar trigger para materials (quando custo muda)
CREATE TRIGGER trigger_material_cost_change
  AFTER UPDATE OF cost_per_unit ON materials
  FOR EACH ROW
  WHEN (OLD.cost_per_unit IS DISTINCT FROM NEW.cost_per_unit)
  EXECUTE FUNCTION trigger_recalculate_on_material_change();

-- 5. Criar trigger para material_lots (quando novos lotes são adicionados)
CREATE TRIGGER trigger_material_lots_change
  AFTER INSERT OR UPDATE OR DELETE ON material_lots
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_on_material_change();

-- 6. Executar recálculo inicial para garantir que tudo está atualizado
SELECT recalculate_perfume_prices_after_material_change();