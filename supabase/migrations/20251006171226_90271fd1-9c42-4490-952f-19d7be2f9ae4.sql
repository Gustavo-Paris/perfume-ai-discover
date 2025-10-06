-- Add search_path to critical security definer functions
-- This prevents SQL injection vulnerabilities

-- Drop and recreate update_perfume_avg_cost with correct return type and search_path
DROP FUNCTION IF EXISTS public.update_perfume_avg_cost(uuid);

CREATE OR REPLACE FUNCTION public.update_perfume_avg_cost(perfume_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_cost numeric;
BEGIN
  -- Calcular custo médio ponderado por ml
  SELECT 
    COALESCE(
      SUM(il.total_cost) / NULLIF(SUM(il.qty_ml), 0),
      0
    )
  INTO avg_cost
  FROM inventory_lots il
  WHERE il.perfume_id = perfume_uuid;
  
  -- Atualizar perfume
  UPDATE perfumes
  SET avg_cost_per_ml = avg_cost
  WHERE id = perfume_uuid;
END;
$$;

-- Ensure consume_material has search_path
DROP FUNCTION IF EXISTS public.consume_material(uuid, numeric, uuid, text);

CREATE OR REPLACE FUNCTION public.consume_material(
  material_uuid uuid,
  quantity_consumed numeric,
  order_uuid uuid DEFAULT NULL,
  notes_text text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock numeric;
BEGIN
  -- Buscar estoque atual
  SELECT materials.current_stock INTO current_stock
  FROM materials
  WHERE id = material_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Material não encontrado';
  END IF;
  
  IF current_stock < quantity_consumed THEN
    RAISE WARNING 'Estoque insuficiente: disponível %, necessário %', current_stock, quantity_consumed;
    RETURN false;
  END IF;
  
  -- Atualizar estoque do material
  UPDATE materials
  SET current_stock = current_stock - quantity_consumed
  WHERE id = material_uuid;
  
  -- Registrar movimento
  INSERT INTO material_movements (
    material_id,
    movement_type,
    quantity,
    notes,
    order_id
  ) VALUES (
    material_uuid,
    'output',
    -quantity_consumed,
    notes_text,
    order_uuid
  );
  
  RETURN true;
END;
$$;