-- Criar triggers para recalcular preços automaticamente

-- Trigger para recalcular quando materiais mudarem
CREATE OR REPLACE FUNCTION trigger_recalculate_prices_on_material_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalcular todos os preços quando materiais mudarem
  PERFORM recalculate_all_perfume_prices();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular quando lotes de inventário mudarem
CREATE OR REPLACE FUNCTION trigger_recalculate_prices_on_inventory_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalcular preços para o perfume específico
  PERFORM recalculate_all_perfume_prices();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS material_price_recalc ON materials;
CREATE TRIGGER material_price_recalc
  AFTER INSERT OR UPDATE OR DELETE ON materials
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_prices_on_material_change();

DROP TRIGGER IF EXISTS inventory_price_recalc ON inventory_lots;  
CREATE TRIGGER inventory_price_recalc
  AFTER INSERT OR UPDATE OR DELETE ON inventory_lots
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_prices_on_inventory_change();