-- Create function to update material average cost based on lots
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
  new_stock numeric := 0;
BEGIN
  -- Calculate weighted average cost from all lots
  SELECT 
    COALESCE(SUM(quantity * cost_per_unit), 0),
    COALESCE(SUM(quantity), 0)
  INTO total_cost, total_quantity
  FROM material_lots 
  WHERE material_id = material_uuid;
  
  -- Calculate new average cost and current stock
  IF total_quantity > 0 THEN
    new_avg_cost := total_cost / total_quantity;
    new_stock := total_quantity;
  END IF;
  
  -- Update material with new average cost and current stock
  UPDATE materials 
  SET 
    cost_per_unit = new_avg_cost,
    current_stock = new_stock,
    updated_at = now()
  WHERE id = material_uuid;
END;
$function$;

-- Create trigger function for material lots
CREATE OR REPLACE FUNCTION public.trigger_update_material_avg_cost()
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

-- Create trigger on material_lots table
DROP TRIGGER IF EXISTS trigger_material_lots_avg_cost ON material_lots;
CREATE TRIGGER trigger_material_lots_avg_cost
  AFTER INSERT OR UPDATE OR DELETE ON material_lots
  FOR EACH ROW EXECUTE FUNCTION trigger_update_material_avg_cost();

-- Create enhanced function to recalculate all prices when materials change
CREATE OR REPLACE FUNCTION public.trigger_price_recalculation_on_materials()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Recalculate all product prices when material costs change
  PERFORM recalculate_all_prices();
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger on materials table to recalculate prices when costs change
DROP TRIGGER IF EXISTS trigger_materials_price_recalc ON materials;
CREATE TRIGGER trigger_materials_price_recalc
  AFTER UPDATE OF cost_per_unit ON materials
  FOR EACH ROW EXECUTE FUNCTION trigger_price_recalculation_on_materials();

-- Recalculate existing material costs
DO $$
DECLARE
  material_record RECORD;
BEGIN
  FOR material_record IN SELECT id FROM materials LOOP
    PERFORM update_material_avg_cost(material_record.id);
  END LOOP;
END $$;