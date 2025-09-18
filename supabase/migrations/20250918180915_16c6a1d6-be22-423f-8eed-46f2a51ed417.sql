-- Corrigir search_path das funções trigger
CREATE OR REPLACE FUNCTION trigger_recalculate_prices_on_material_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM recalculate_all_perfume_prices();
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION trigger_recalculate_prices_on_inventory_change()
RETURNS TRIGGER
LANGUAGE plpgsql  
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM recalculate_all_perfume_prices();
  RETURN COALESCE(NEW, OLD);
END;
$$;