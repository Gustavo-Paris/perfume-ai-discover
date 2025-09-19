-- Função para recalcular custos médios dos materiais baseados nos lotes
CREATE OR REPLACE FUNCTION public.update_material_avg_cost(material_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_cost numeric := 0;
  total_quantity numeric := 0;
  new_avg_cost numeric := 0;
  total_stock numeric := 0;
BEGIN
  -- Calculate weighted average cost and total stock from all lots
  SELECT 
    COALESCE(SUM(quantity * cost_per_unit), 0),
    COALESCE(SUM(quantity), 0)
  INTO total_cost, total_quantity
  FROM material_lots 
  WHERE material_id = material_uuid;
  
  -- Calculate new average cost
  IF total_quantity > 0 THEN
    new_avg_cost := total_cost / total_quantity;
  END IF;
  
  -- Set current stock to total quantity from lots
  total_stock := total_quantity;
  
  -- Update material with new average cost and stock
  UPDATE materials 
  SET 
    cost_per_unit = new_avg_cost,
    current_stock = total_stock,
    updated_at = now()
  WHERE id = material_uuid;
END;
$function$;

-- Função para recalcular custos de todos os materiais
CREATE OR REPLACE FUNCTION public.recalculate_all_material_costs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  material_record RECORD;
  updated_count integer := 0;
BEGIN
  -- Para cada material ativo, recalcular custo baseado nos lotes
  FOR material_record IN 
    SELECT id FROM materials WHERE is_active = true
  LOOP
    PERFORM update_material_avg_cost(material_record.id);
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_materials', updated_count,
    'message', format('Custos recalculados para %s materiais', updated_count)
  );
END;
$function$;

-- Trigger para recalcular automaticamente quando lotes mudarem
CREATE OR REPLACE FUNCTION public.trigger_material_cost_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_material_avg_cost(NEW.material_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_material_avg_cost(OLD.material_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Aplicar trigger na tabela material_lots
DROP TRIGGER IF EXISTS trigger_update_material_cost ON material_lots;
CREATE TRIGGER trigger_update_material_cost
  AFTER INSERT OR UPDATE OR DELETE ON material_lots
  FOR EACH ROW
  EXECUTE FUNCTION trigger_material_cost_update();