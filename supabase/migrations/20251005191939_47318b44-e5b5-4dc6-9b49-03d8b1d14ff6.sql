-- Corrigir função check_perfume_availability para considerar reservas
CREATE OR REPLACE FUNCTION public.check_perfume_availability(
  perfume_uuid uuid, 
  size_ml_param integer, 
  quantity_requested integer DEFAULT 1
)
RETURNS TABLE(available boolean, max_quantity integer, stock_ml integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_ml integer;
  reserved_qty integer;
  units_available integer;
BEGIN
  -- Buscar estoque total em ml
  SELECT COALESCE(SUM(il.qty_ml), 0)
  INTO total_ml
  FROM inventory_lots il
  WHERE il.perfume_id = perfume_uuid;
  
  -- Buscar quantidade já reservada (ativa) para este tamanho
  SELECT COALESCE(SUM(r.qty), 0)
  INTO reserved_qty
  FROM reservations r
  WHERE r.perfume_id = perfume_uuid 
    AND r.size_ml = size_ml_param
    AND r.expires_at > now();
  
  -- Calcular unidades disponíveis: (estoque total / ml por unidade) - reservas ativas
  units_available := (total_ml / size_ml_param) - reserved_qty;
  
  RETURN QUERY SELECT 
    units_available >= quantity_requested as available,
    GREATEST(0, units_available) as max_quantity,
    total_ml as stock_ml;
END;
$function$;