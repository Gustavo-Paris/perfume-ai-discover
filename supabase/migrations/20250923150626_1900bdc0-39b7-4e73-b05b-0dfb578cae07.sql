-- Fix function to use correct column names
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
  
  -- Check if already processed (using correct column name)
  IF EXISTS (SELECT 1 FROM stock_movements WHERE related_order_id = order_uuid) THEN
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
      
      -- Create stock movement record (using correct column names)
      INSERT INTO stock_movements (
        perfume_id, lot_id, change_ml, movement_type, 
        related_order_id, notes
      ) VALUES (
        item_record.perfume_id, lot_record.id, -consumed_ml, 'sale',
        order_uuid, 
        format('Venda: %s %s - %sml', item_record.brand, item_record.name, item_record.size_ml)
      ) RETURNING id INTO movement_id;
      
      movements_created := movements_created || jsonb_build_object(
        'movement_id', movement_id,
        'lot_id', lot_record.id,
        'consumed_ml', consumed_ml,
        'perfume', item_record.name
      );
      
      remaining_ml := remaining_ml - consumed_ml;
    END LOOP;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true, 
    'movements_created', movements_created,
    'order_number', order_record.order_number
  );
END;
$$;

-- Now test the function manually
SELECT process_order_stock_movement('b174a82e-6cac-4072-9899-2db1192eab0e');