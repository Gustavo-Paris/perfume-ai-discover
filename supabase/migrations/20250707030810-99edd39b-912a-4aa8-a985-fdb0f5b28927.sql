-- Fix the ambiguous status column reference in the trigger function
CREATE OR REPLACE FUNCTION public.update_cart_session_activity()
 RETURNS trigger
 LANGUAGE plpgsql
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