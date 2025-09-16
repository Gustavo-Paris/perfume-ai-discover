-- Criar trigger para recalcular preços automaticamente quando lotes de perfume são modificados

-- Criar/atualizar função trigger para inventory_lots
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

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS inventory_lots_update_avg_cost ON public.inventory_lots;

-- Criar novo trigger na tabela inventory_lots
CREATE TRIGGER inventory_lots_update_avg_cost
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory_lots
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_avg_cost();