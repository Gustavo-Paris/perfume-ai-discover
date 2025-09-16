-- Criar trigger para recalcular preços automaticamente quando lotes são modificados

-- Primeiro, verificar se a função trigger_update_avg_cost existe, se não, criar
CREATE OR REPLACE FUNCTION public.trigger_update_avg_cost()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_perfume_avg_cost(NEW.perfume_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_perfume_avg_cost(OLD.perfume_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path TO 'public';

-- Criar trigger na tabela inventory_lots
DROP TRIGGER IF EXISTS inventory_lots_update_avg_cost ON public.inventory_lots;

CREATE TRIGGER inventory_lots_update_avg_cost
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory_lots
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_avg_cost();

-- Também criar trigger para material_lots se não existir
DROP TRIGGER IF EXISTS material_lots_update_avg_cost ON public.material_lots;

CREATE TRIGGER material_lots_update_avg_cost
  AFTER INSERT OR UPDATE OR DELETE ON public.material_lots
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_material_avg_cost();

-- Função para material_lots se não existir
CREATE OR REPLACE FUNCTION public.trigger_material_avg_cost()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SET search_path TO 'public';