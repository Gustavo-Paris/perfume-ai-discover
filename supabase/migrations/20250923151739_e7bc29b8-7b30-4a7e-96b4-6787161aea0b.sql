-- Corrigir a função process_order_stock_movement removendo a referência à coluna inexistente
CREATE OR REPLACE FUNCTION process_order_stock_movement(order_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  result JSONB := '{"success": true, "movements": []}'::jsonb;
  movement_details JSONB;
BEGIN
  -- Buscar dados do pedido
  SELECT * INTO order_record
  FROM orders 
  WHERE id = order_uuid;
  
  IF NOT FOUND THEN
    RETURN '{"success": false, "error": "Pedido não encontrado"}'::jsonb;
  END IF;
  
  -- Log de início
  RAISE NOTICE 'Processando movimentação de estoque para pedido: %', order_uuid;
  
  -- Para cada item do pedido
  FOR item_record IN
    SELECT oi.*, p.name, p.brand
    FROM order_items oi
    JOIN perfumes p ON oi.perfume_id = p.id
    WHERE oi.order_id = order_uuid
  LOOP
    -- Calcular ml necessário
    remaining_ml := item_record.size_ml * item_record.quantity;
    total_items := total_items + item_record.quantity;
    
    RAISE NOTICE 'Processando item: % %ml, quantidade: %, total ml: %', 
      item_record.name, item_record.size_ml, item_record.quantity, remaining_ml;
    
    -- Consumir do estoque de perfumes (FIFO - primeiro lote mais antigo)
    FOR lot_record IN
      SELECT * FROM inventory_lots 
      WHERE perfume_id = item_record.perfume_id 
      AND qty_ml > 0
      ORDER BY created_at ASC
    LOOP
      IF remaining_ml <= 0 THEN
        EXIT;
      END IF;
      
      -- Determinar quanto consumir deste lote
      consumed_ml := LEAST(remaining_ml, lot_record.qty_ml);
      
      -- Atualizar lote
      UPDATE inventory_lots 
      SET qty_ml = qty_ml - consumed_ml
      WHERE id = lot_record.id;
      
      -- Registrar movimento de estoque de perfume (sem inventory_lot_id)
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
      
      RAISE NOTICE 'Consumido %ml do lote %, restam %ml', 
        consumed_ml, lot_record.lot_code, remaining_ml;
    END LOOP;
    
    -- Verificar se conseguiu consumir tudo
    IF remaining_ml > 0 THEN
      RAISE WARNING 'Estoque insuficiente para %: faltam %ml', item_record.name, remaining_ml;
    END IF;
    
    -- Consumir materiais por tamanho
    -- Frascos
    IF item_record.size_ml = 2 THEN
      -- Consumir frascos 2ml
      SELECT * INTO material_record FROM materials WHERE name = 'Frasco 2ml' AND is_active = true;
      IF FOUND THEN
        PERFORM consume_material(material_record.id, item_record.quantity, order_uuid, 
          format('Frascos 2ml para pedido %s', order_record.order_number));
      END IF;
    ELSIF item_record.size_ml = 5 THEN
      -- Consumir frascos 5ml
      SELECT * INTO material_record FROM materials WHERE name = 'Frasco 5ml' AND is_active = true;
      IF FOUND THEN
        PERFORM consume_material(material_record.id, item_record.quantity, order_uuid,
          format('Frascos 5ml para pedido %s', order_record.order_number));
      END IF;
    ELSIF item_record.size_ml = 10 THEN
      -- Consumir frascos 10ml
      SELECT * INTO material_record FROM materials WHERE name = 'Frasco 10ml' AND is_active = true;
      IF FOUND THEN
        PERFORM consume_material(material_record.id, item_record.quantity, order_uuid,
          format('Frascos 10ml para pedido %s', order_record.order_number));
      END IF;
    END IF;
    
    -- Consumir etiquetas (1 por frasco)
    SELECT * INTO material_record FROM materials WHERE name = 'Etiqueta Padrão' AND is_active = true;
    IF FOUND THEN
      PERFORM consume_material(material_record.id, item_record.quantity, order_uuid,
        format('Etiquetas para pedido %s', order_record.order_number));
    END IF;
    
  END LOOP;
  
  -- Calcular caixas necessárias (baseado na regra de packaging)
  -- Assumindo 1 caixa para cada pedido (pode ser ajustado)
  boxes_needed := 1;
  
  -- Consumir caixas
  SELECT * INTO material_record FROM materials WHERE name = 'Caixa' AND is_active = true;
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