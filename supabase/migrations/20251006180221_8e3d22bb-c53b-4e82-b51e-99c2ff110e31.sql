-- Fix process_order_stock_movement to validate stock BEFORE consuming
-- This prevents partial stock movements and inconsistent states

DROP FUNCTION IF EXISTS public.process_order_stock_movement(uuid);

CREATE OR REPLACE FUNCTION public.process_order_stock_movement(order_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_record RECORD;
  item_record RECORD;
  lot_record RECORD;
  material_record RECORD;
  remaining_ml INTEGER;
  consumed_ml INTEGER;
  total_items INTEGER := 0;
  boxes_needed INTEGER := 0;
  available_stock INTEGER;
  material_stock NUMERIC;
  result JSONB := '{"success": true, "movements": []}'::jsonb;
BEGIN
  -- Buscar dados do pedido
  SELECT * INTO order_record
  FROM orders 
  WHERE id = order_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Pedido não encontrado',
      'order_id', order_uuid
    );
  END IF;
  
  RAISE NOTICE 'Processando movimentação de estoque para pedido: %', order_uuid;
  
  -- FASE 1: VALIDAÇÃO DE ESTOQUE (sem consumir nada ainda)
  FOR item_record IN
    SELECT oi.*, p.name, p.brand
    FROM order_items oi
    JOIN perfumes p ON oi.perfume_id = p.id
    WHERE oi.order_id = order_uuid
  LOOP
    remaining_ml := item_record.size_ml * item_record.quantity;
    
    -- Verificar se há estoque suficiente de perfume
    SELECT COALESCE(SUM(qty_ml), 0) INTO available_stock
    FROM inventory_lots
    WHERE perfume_id = item_record.perfume_id AND qty_ml > 0;
    
    IF available_stock < remaining_ml THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format('Estoque insuficiente de perfume: %s - %s (disponível: %sml, necessário: %sml)',
          item_record.brand, item_record.name, available_stock, remaining_ml),
        'order_id', order_uuid,
        'perfume_id', item_record.perfume_id,
        'available_ml', available_stock,
        'required_ml', remaining_ml
      );
    END IF;
    
    -- Validar estoque de frascos
    IF item_record.size_ml = 2 THEN
      SELECT id, current_stock INTO material_record 
      FROM materials 
      WHERE name = 'Frasco 2ml' AND is_active = true 
      LIMIT 1;
      
      IF FOUND THEN
        IF material_record.current_stock < item_record.quantity THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', format('Estoque insuficiente de Frasco 2ml (disponível: %s, necessário: %s)',
              material_record.current_stock, item_record.quantity),
            'order_id', order_uuid
          );
        END IF;
      END IF;
      
    ELSIF item_record.size_ml = 5 THEN
      SELECT id, current_stock INTO material_record 
      FROM materials 
      WHERE name = 'Frasco 5ml' AND is_active = true 
      LIMIT 1;
      
      IF FOUND THEN
        IF material_record.current_stock < item_record.quantity THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', format('Estoque insuficiente de Frasco 5ml (disponível: %s, necessário: %s)',
              material_record.current_stock, item_record.quantity),
            'order_id', order_uuid
          );
        END IF;
      END IF;
      
    ELSIF item_record.size_ml = 10 THEN
      SELECT id, current_stock INTO material_record 
      FROM materials 
      WHERE name = 'Frasco 10ml' AND is_active = true 
      LIMIT 1;
      
      IF FOUND THEN
        IF material_record.current_stock < item_record.quantity THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', format('Estoque insuficiente de Frasco 10ml (disponível: %s, necessário: %s)',
              material_record.current_stock, item_record.quantity),
            'order_id', order_uuid
          );
        END IF;
      END IF;
    END IF;
    
    -- Validar estoque de etiquetas
    SELECT id, current_stock INTO material_record 
    FROM materials 
    WHERE name = 'Etiqueta Padrão' AND is_active = true 
    LIMIT 1;
    
    IF FOUND THEN
      IF material_record.current_stock < item_record.quantity THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', format('Estoque insuficiente de Etiqueta Padrão (disponível: %s, necessário: %s)',
            material_record.current_stock, item_record.quantity),
          'order_id', order_uuid
        );
      END IF;
    END IF;
    
    total_items := total_items + item_record.quantity;
  END LOOP;
  
  -- Validar estoque de caixas
  boxes_needed := 1;
  SELECT id, current_stock INTO material_record 
  FROM materials 
  WHERE name = 'Caixa' AND is_active = true 
  LIMIT 1;
  
  IF FOUND THEN
    IF material_record.current_stock < boxes_needed THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format('Estoque insuficiente de Caixa (disponível: %s, necessário: %s)',
          material_record.current_stock, boxes_needed),
        'order_id', order_uuid
      );
    END IF;
  END IF;
  
  -- FASE 2: CONSUMO DE ESTOQUE (só executa se passou em todas validações)
  FOR item_record IN
    SELECT oi.*, p.name, p.brand
    FROM order_items oi
    JOIN perfumes p ON oi.perfume_id = p.id
    WHERE oi.order_id = order_uuid
  LOOP
    remaining_ml := item_record.size_ml * item_record.quantity;
    
    -- Consumir do estoque de perfumes (FIFO)
    FOR lot_record IN
      SELECT * FROM inventory_lots 
      WHERE perfume_id = item_record.perfume_id 
      AND qty_ml > 0
      ORDER BY created_at ASC
    LOOP
      IF remaining_ml <= 0 THEN
        EXIT;
      END IF;
      
      consumed_ml := LEAST(remaining_ml, lot_record.qty_ml);
      
      -- Atualizar lote
      UPDATE inventory_lots 
      SET qty_ml = qty_ml - consumed_ml
      WHERE id = lot_record.id;
      
      -- Registrar movimento
      INSERT INTO stock_movements (
        perfume_id, 
        movement_type, 
        change_ml, 
        notes,
        order_id
      ) VALUES (
        item_record.perfume_id,
        'sale',
        -consumed_ml,
        format('Venda - Lote %s - Pedido %s: %sx %sml %s', 
          lot_record.lot_code,
          order_record.order_number, 
          item_record.quantity, 
          item_record.size_ml, 
          item_record.name
        ),
        order_uuid
      );
      
      remaining_ml := remaining_ml - consumed_ml;
    END LOOP;
    
    -- Consumir materiais
    IF item_record.size_ml = 2 THEN
      SELECT * INTO material_record FROM materials WHERE name = 'Frasco 2ml' AND is_active = true LIMIT 1;
      IF FOUND THEN
        PERFORM consume_material(material_record.id, item_record.quantity, order_uuid, 
          format('Frascos 2ml para pedido %s', order_record.order_number));
      END IF;
    ELSIF item_record.size_ml = 5 THEN
      SELECT * INTO material_record FROM materials WHERE name = 'Frasco 5ml' AND is_active = true LIMIT 1;
      IF FOUND THEN
        PERFORM consume_material(material_record.id, item_record.quantity, order_uuid,
          format('Frascos 5ml para pedido %s', order_record.order_number));
      END IF;
    ELSIF item_record.size_ml = 10 THEN
      SELECT * INTO material_record FROM materials WHERE name = 'Frasco 10ml' AND is_active = true LIMIT 1;
      IF FOUND THEN
        PERFORM consume_material(material_record.id, item_record.quantity, order_uuid,
          format('Frascos 10ml para pedido %s', order_record.order_number));
      END IF;
    END IF;
    
    -- Consumir etiquetas
    SELECT * INTO material_record FROM materials WHERE name = 'Etiqueta Padrão' AND is_active = true LIMIT 1;
    IF FOUND THEN
      PERFORM consume_material(material_record.id, item_record.quantity, order_uuid,
        format('Etiquetas para pedido %s', order_record.order_number));
    END IF;
  END LOOP;
  
  -- Consumir caixas
  SELECT * INTO material_record FROM materials WHERE name = 'Caixa' AND is_active = true LIMIT 1;
  IF FOUND THEN
    PERFORM consume_material(material_record.id, boxes_needed, order_uuid,
      format('Caixa para envio do pedido %s', order_record.order_number));
  END IF;
  
  RAISE NOTICE 'Movimentação concluída para pedido %: % itens, % caixa(s)', 
    order_record.order_number, total_items, boxes_needed;
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', order_uuid,
    'items_processed', total_items,
    'boxes_used', boxes_needed,
    'message', format('Estoque atualizado para pedido %s', order_record.order_number)
  );
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro ao processar movimentação: %', SQLERRM;
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'order_id', order_uuid
  );
END;
$$;