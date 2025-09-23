-- Create the missing stock movement function and trigger
CREATE OR REPLACE FUNCTION process_order_stock_movement(order_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  order_record RECORD;
  item_record RECORD;
  lot_record RECORD;
  remaining_ml integer;
  consumed_ml integer;
  movement_id uuid;
  movements_created jsonb := '[]'::jsonb;
BEGIN
  -- Get order details
  SELECT * INTO order_record FROM orders WHERE id = order_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  -- Only process paid orders
  IF order_record.payment_status != 'paid' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not paid');
  END IF;
  
  -- Check if already processed
  IF EXISTS (SELECT 1 FROM stock_movements WHERE order_id = order_uuid) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Stock already processed');
  END IF;
  
  -- Process each order item
  FOR item_record IN 
    SELECT oi.*, p.name, p.brand 
    FROM order_items oi 
    JOIN perfumes p ON oi.perfume_id = p.id 
    WHERE oi.order_id = order_uuid
  LOOP
    remaining_ml := item_record.size_ml * item_record.quantity;
    
    -- Consume from inventory lots (FIFO)
    FOR lot_record IN 
      SELECT * FROM inventory_lots 
      WHERE perfume_id = item_record.perfume_id 
      AND qty_ml > 0 
      ORDER BY created_at ASC
    LOOP
      EXIT WHEN remaining_ml <= 0;
      
      consumed_ml := LEAST(remaining_ml, lot_record.qty_ml);
      
      -- Update inventory lot
      UPDATE inventory_lots 
      SET qty_ml = qty_ml - consumed_ml
      WHERE id = lot_record.id;
      
      -- Create stock movement record
      INSERT INTO stock_movements (
        perfume_id, lot_id, quantity_ml, movement_type, 
        order_id, notes, user_id
      ) VALUES (
        item_record.perfume_id, lot_record.id, -consumed_ml, 'sale',
        order_uuid, 
        format('Venda: %s %s - %sml', item_record.brand, item_record.name, item_record.size_ml),
        order_record.user_id
      ) RETURNING id INTO movement_id;
      
      movements_created := movements_created || jsonb_build_object(
        'movement_id', movement_id,
        'lot_id', lot_record.id,
        'consumed_ml', consumed_ml,
        'perfume', item_record.name
      );
      
      remaining_ml := remaining_ml - consumed_ml;
    END LOOP;
    
    -- Consume materials (bottles and labels)
    -- For each item, we need: 1 bottle + 1 label
    DECLARE
      bottle_material_id uuid;
      label_material_id uuid;
    BEGIN
      -- Find appropriate bottle material based on size
      SELECT id INTO bottle_material_id FROM materials 
      WHERE type = 'input' 
      AND (
        (item_record.size_ml = 2 AND name ILIKE '%2ml%') OR
        (item_record.size_ml = 5 AND name ILIKE '%5ml%') OR
        (item_record.size_ml = 10 AND name ILIKE '%10ml%') OR
        (item_record.size_ml >= 50 AND name ILIKE '%50ml%')
      )
      AND is_active = true
      ORDER BY name
      LIMIT 1;
      
      -- Find label material
      SELECT id INTO label_material_id FROM materials 
      WHERE type = 'input' 
      AND name ILIKE '%etiqueta%'
      AND is_active = true
      ORDER BY name
      LIMIT 1;
      
      -- Consume bottle material
      IF bottle_material_id IS NOT NULL THEN
        UPDATE materials 
        SET current_stock = current_stock - item_record.quantity
        WHERE id = bottle_material_id AND current_stock >= item_record.quantity;
        
        INSERT INTO stock_movements (
          material_id, quantity_ml, movement_type, order_id, notes
        ) VALUES (
          bottle_material_id, -item_record.quantity, 'consumption',
          order_uuid, format('Consumo frasco %sml - Pedido %s', item_record.size_ml, order_record.order_number)
        );
      END IF;
      
      -- Consume label material
      IF label_material_id IS NOT NULL THEN
        UPDATE materials 
        SET current_stock = current_stock - item_record.quantity
        WHERE id = label_material_id AND current_stock >= item_record.quantity;
        
        INSERT INTO stock_movements (
          material_id, quantity_ml, movement_type, order_id, notes
        ) VALUES (
          label_material_id, -item_record.quantity, 'consumption',
          order_uuid, format('Consumo etiqueta - Pedido %s', order_record.order_number)
        );
      END IF;
    END;
  END LOOP;
  
  -- Update perfume average costs
  FOR item_record IN 
    SELECT DISTINCT perfume_id FROM order_items WHERE order_id = order_uuid
  LOOP
    PERFORM update_perfume_avg_cost(item_record.perfume_id);
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true, 
    'movements_created', movements_created,
    'order_number', order_record.order_number
  );
END;
$$;

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_stock_movement_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only trigger when payment status changes to 'paid'
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    PERFORM process_order_stock_movement(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on orders table
DROP TRIGGER IF EXISTS trigger_stock_on_order_paid ON orders;
CREATE TRIGGER trigger_stock_on_order_paid
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_stock_movement_on_payment();