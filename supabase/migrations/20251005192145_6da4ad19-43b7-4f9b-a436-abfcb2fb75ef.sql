-- Corrigir check_perfume_availability para NÃO contar a reserva do próprio usuário
CREATE OR REPLACE FUNCTION public.check_perfume_availability(
  perfume_uuid uuid, 
  size_ml_param integer, 
  quantity_requested integer DEFAULT 1,
  user_uuid uuid DEFAULT NULL
)
RETURNS TABLE(available boolean, max_quantity integer, stock_ml integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_ml integer;
  reserved_by_others integer;
  units_available integer;
BEGIN
  -- Buscar estoque total em ml
  SELECT COALESCE(SUM(il.qty_ml), 0)
  INTO total_ml
  FROM inventory_lots il
  WHERE il.perfume_id = perfume_uuid;
  
  -- Buscar quantidade reservada por OUTROS usuários (não o usuário atual)
  -- Isso permite que o usuário atual adicione mais ao seu próprio carrinho
  SELECT COALESCE(SUM(r.qty), 0)
  INTO reserved_by_others
  FROM reservations r
  WHERE r.perfume_id = perfume_uuid 
    AND r.size_ml = size_ml_param
    AND r.expires_at > now()
    AND (user_uuid IS NULL OR r.user_id != user_uuid);
  
  -- Calcular unidades disponíveis: (estoque total / ml por unidade) - reservas de outros
  units_available := (total_ml / size_ml_param) - reserved_by_others;
  
  RETURN QUERY SELECT 
    units_available >= quantity_requested as available,
    GREATEST(0, units_available) as max_quantity,
    total_ml as stock_ml;
END;
$function$;