-- TASK 5: Corrigir função consume_material para usar 'consumption' ao invés de 'output'

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
  
  -- Registrar movimento (usando 'consumption' para vendas)
  INSERT INTO material_movements (
    material_id,
    movement_type,
    quantity,
    notes,
    order_id
  ) VALUES (
    material_uuid,
    'consumption', -- Mudado de 'output' para 'consumption'
    -quantity_consumed,
    notes_text,
    order_uuid
  );
  
  RETURN true;
END;
$$;