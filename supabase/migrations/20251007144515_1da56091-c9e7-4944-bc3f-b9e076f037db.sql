-- TASK 5: Correções no schema de consumo de estoque e melhorias de rastreabilidade (FIX)

-- 1. Corrigir coluna em material_movements (change_quantity → quantity)
ALTER TABLE material_movements 
  RENAME COLUMN change_quantity TO quantity;

-- 2. Ajustar constraint de movement_type para incluir 'output' e 'consumption'
ALTER TABLE material_movements 
  DROP CONSTRAINT IF EXISTS material_movements_movement_type_check;

ALTER TABLE material_movements 
  ADD CONSTRAINT material_movements_movement_type_check 
  CHECK (movement_type IN ('purchase', 'sale', 'consumption', 'output', 'adjust', 'return'));

-- 3. Criar funções separadas para logs de compliance

-- Função para stock_movements
CREATE OR REPLACE FUNCTION log_stock_movement_compliance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO compliance_audit_log (
    user_id,
    action_type,
    resource_type,
    resource_id,
    details,
    legal_basis
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'stock_movement',
    'perfume_stock',
    NEW.perfume_id::text,
    jsonb_build_object(
      'movement_type', NEW.movement_type,
      'change_ml', NEW.change_ml,
      'lot_id', NEW.lot_id,
      'order_id', NEW.order_id,
      'notes', NEW.notes
    ),
    'inventory_control'
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Não bloquear operação se log falhar
  RETURN NEW;
END;
$$;

-- Função para material_movements
CREATE OR REPLACE FUNCTION log_material_movement_compliance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO compliance_audit_log (
    user_id,
    action_type,
    resource_type,
    resource_id,
    details,
    legal_basis
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'material_movement',
    'material_stock',
    NEW.material_id::text,
    jsonb_build_object(
      'movement_type', NEW.movement_type,
      'quantity', NEW.quantity,
      'material_lot_id', NEW.material_lot_id,
      'order_id', NEW.order_id,
      'notes', NEW.notes
    ),
    'inventory_control'
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Não bloquear operação se log falhar
  RETURN NEW;
END;
$$;

-- Aplicar triggers
DROP TRIGGER IF EXISTS log_stock_movement_trigger ON stock_movements;
CREATE TRIGGER log_stock_movement_trigger
  AFTER INSERT ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION log_stock_movement_compliance();

DROP TRIGGER IF EXISTS log_material_movement_trigger ON material_movements;
CREATE TRIGGER log_material_movement_trigger
  AFTER INSERT ON material_movements
  FOR EACH ROW
  EXECUTE FUNCTION log_material_movement_compliance();

-- 4. Criar função RPC para validar estoque antes do checkout
CREATE OR REPLACE FUNCTION validate_cart_stock_availability(cart_items_param jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  perfume_stock integer;
  insufficient_items jsonb := '[]'::jsonb;
  item_info jsonb;
  material_record RECORD;
  needed_quantity numeric;
BEGIN
  -- Verificar cada item do carrinho
  FOR item IN SELECT * FROM jsonb_array_elements(cart_items_param)
  LOOP
    -- Verificar estoque de perfume (em ml)
    SELECT COALESCE(SUM(il.qty_ml), 0)
    INTO perfume_stock
    FROM inventory_lots il
    WHERE il.perfume_id = (item->>'perfume_id')::uuid;
    
    -- Verificar se há estoque suficiente para o tamanho solicitado
    IF perfume_stock < ((item->>'size_ml')::integer * (item->>'quantity')::integer) THEN
      item_info := jsonb_build_object(
        'perfume_id', item->>'perfume_id',
        'perfume_name', (SELECT name FROM perfumes WHERE id = (item->>'perfume_id')::uuid),
        'size_ml', item->>'size_ml',
        'quantity_requested', item->>'quantity',
        'available_ml', perfume_stock,
        'available_units', FLOOR(perfume_stock / (item->>'size_ml')::integer),
        'issue', 'insufficient_perfume_stock'
      );
      insufficient_items := insufficient_items || item_info;
    END IF;
    
    -- Verificar estoque de materiais necessários (frascos, etiquetas)
    FOR material_record IN 
      SELECT m.id, m.name, m.current_stock, pr.quantity_needed
      FROM product_recipes pr
      JOIN materials m ON pr.material_id = m.id
      WHERE pr.perfume_id = (item->>'perfume_id')::uuid
        AND pr.size_ml = (item->>'size_ml')::integer
        AND m.is_active = true
    LOOP
      needed_quantity := material_record.quantity_needed * (item->>'quantity')::integer;
      
      IF material_record.current_stock < needed_quantity THEN
        item_info := jsonb_build_object(
          'perfume_id', item->>'perfume_id',
          'perfume_name', (SELECT name FROM perfumes WHERE id = (item->>'perfume_id')::uuid),
          'size_ml', item->>'size_ml',
          'quantity_requested', item->>'quantity',
          'material_name', material_record.name,
          'material_available', material_record.current_stock,
          'material_needed', needed_quantity,
          'issue', 'insufficient_material_stock'
        );
        insufficient_items := insufficient_items || item_info;
      END IF;
    END LOOP;
  END LOOP;
  
  -- Retornar resultado
  IF jsonb_array_length(insufficient_items) > 0 THEN
    RETURN jsonb_build_object(
      'available', false,
      'insufficient_items', insufficient_items
    );
  ELSE
    RETURN jsonb_build_object(
      'available', true,
      'message', 'Todos os itens têm estoque disponível'
    );
  END IF;
END;
$$;

-- 5. Criar trigger para alertas automáticos de estoque baixo
CREATE OR REPLACE FUNCTION check_low_stock_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_stock integer;
  perfume_name text;
  alert_threshold integer := 50; -- ml
BEGIN
  -- Calcular estoque total após movimento
  SELECT COALESCE(SUM(il.qty_ml), 0), p.name
  INTO total_stock, perfume_name
  FROM inventory_lots il
  JOIN perfumes p ON il.perfume_id = p.id
  WHERE il.perfume_id = NEW.perfume_id
  GROUP BY p.name;
  
  -- Se estoque baixo, criar notificação para admins
  IF total_stock < alert_threshold THEN
    INSERT INTO notifications (type, message, metadata)
    SELECT 
      'low_stock_alert',
      format('Estoque baixo: %s (%s ml restantes)', perfume_name, total_stock),
      jsonb_build_object(
        'perfume_id', NEW.perfume_id,
        'current_stock_ml', total_stock,
        'threshold', alert_threshold,
        'movement_type', NEW.movement_type
      )
    FROM user_roles
    WHERE role = 'admin';
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Não bloquear operação se notificação falhar
  RETURN NEW;
END;
$$;

-- Aplicar trigger de alerta de estoque baixo
DROP TRIGGER IF EXISTS low_stock_alert_trigger ON stock_movements;
CREATE TRIGGER low_stock_alert_trigger
  AFTER INSERT ON stock_movements
  FOR EACH ROW
  WHEN (NEW.movement_type IN ('sale', 'consumption', 'output'))
  EXECUTE FUNCTION check_low_stock_alert();

-- 6. Criar view para dashboard de movimentações recentes
CREATE OR REPLACE VIEW recent_stock_movements AS
SELECT 
  sm.id,
  sm.perfume_id,
  p.name as perfume_name,
  p.brand as perfume_brand,
  sm.change_ml,
  sm.movement_type,
  sm.order_id,
  sm.notes,
  sm.created_at,
  il.lot_code,
  COALESCE((
    SELECT SUM(il2.qty_ml)
    FROM inventory_lots il2
    WHERE il2.perfume_id = sm.perfume_id
  ), 0) as current_total_stock
FROM stock_movements sm
JOIN perfumes p ON sm.perfume_id = p.id
LEFT JOIN inventory_lots il ON sm.lot_id = il.id
ORDER BY sm.created_at DESC
LIMIT 100;