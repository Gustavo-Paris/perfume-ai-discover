-- Fix remaining trigger functions with proper search_path

-- 1. Fix update_cart_session_activity trigger function
CREATE OR REPLACE FUNCTION public.update_cart_session_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  session_uuid uuid;
  current_total numeric;
  current_count integer;
BEGIN
  -- Encontrar ou criar sessão do carrinho
  SELECT cs.id INTO session_uuid
  FROM cart_sessions cs
  WHERE cs.user_id = COALESCE(NEW.user_id, OLD.user_id)
    OR cs.session_id = current_setting('app.session_id', true)
  ORDER BY last_activity DESC
  LIMIT 1;
  
  -- Calcular totais atuais do carrinho
  SELECT 
    COUNT(*),
    COALESCE(SUM(ci.quantity * 
      CASE ci.size_ml 
        WHEN 5 THEN COALESCE(p.price_5ml, p.price_full * 0.1)
        WHEN 10 THEN COALESCE(p.price_10ml, p.price_full * 0.2)
        ELSE p.price_full
      END
    ), 0)
  INTO current_count, current_total
  FROM cart_items ci
  JOIN perfumes p ON ci.perfume_id = p.id
  WHERE ci.user_id = COALESCE(NEW.user_id, OLD.user_id);
  
  -- Criar ou atualizar sessão
  INSERT INTO cart_sessions (user_id, session_id, items_count, total_value, last_activity)
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    current_setting('app.session_id', true),
    current_count,
    current_total,
    now()
  )
  ON CONFLICT (user_id, session_id)
  DO UPDATE SET 
    items_count = current_count,
    total_value = current_total,
    last_activity = now(),
    status = CASE WHEN current_count > 0 THEN 'active' ELSE cart_sessions.status END;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 2. Fix trigger_update_material_avg_cost trigger function
CREATE OR REPLACE FUNCTION public.trigger_update_material_avg_cost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 3. Fix safe_inventory_trigger trigger function
CREATE OR REPLACE FUNCTION public.safe_inventory_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  affected_perfume_id UUID;
BEGIN
  -- Determinar qual perfume foi afetado
  affected_perfume_id := COALESCE(NEW.perfume_id, OLD.perfume_id);
  
  -- Só processar se realmente houver mudança significativa
  IF TG_OP = 'INSERT' OR 
     (TG_OP = 'UPDATE' AND (NEW.qty_ml != OLD.qty_ml OR NEW.cost_per_ml != OLD.cost_per_ml)) OR
     TG_OP = 'DELETE' THEN
    
    -- Usar função segura para atualizar custo médio
    PERFORM update_perfume_avg_cost_safe(affected_perfume_id);
    
    -- Agendar recálculo de preços (usando função segura)
    PERFORM recalculate_perfume_prices_for_sizes(
      affected_perfume_id, 
      ARRAY[2, 5, 10, 50]
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, apenas log - não falhar a transação principal
  INSERT INTO price_calculation_logs (
    perfume_id, action_type, trigger_source, error_message
  ) VALUES (
    affected_perfume_id, 'trigger_error', 'inventory_lots_trigger', SQLERRM
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;