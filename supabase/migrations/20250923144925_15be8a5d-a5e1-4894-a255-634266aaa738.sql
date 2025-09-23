-- Criar função para movimentar estoque automaticamente quando pedido é pago
CREATE OR REPLACE FUNCTION public.process_order_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
  item_record RECORD;
  lot_record RECORD;
  remaining_ml INTEGER;
  consume_ml INTEGER;
  frasco_material_id UUID;
  etiqueta_material_id UUID;
  material_config RECORD;
BEGIN
  -- Só processar quando o pedido muda para pago
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    
    -- Para cada item do pedido
    FOR item_record IN 
      SELECT oi.*, p.name, p.brand 
      FROM order_items oi 
      JOIN perfumes p ON oi.perfume_id = p.id 
      WHERE oi.order_id = NEW.id
    LOOP
      -- Calcular total de ml necessário
      remaining_ml := item_record.size_ml * item_record.quantity;
      
      -- Consumir do estoque usando FIFO (primeiro que entra, primeiro que sai)
      FOR lot_record IN
        SELECT * FROM inventory_lots 
        WHERE perfume_id = item_record.perfume_id 
        AND qty_ml > 0
        ORDER BY created_at ASC
      LOOP
        EXIT WHEN remaining_ml <= 0;
        
        -- Determinar quanto consumir deste lote
        consume_ml := LEAST(remaining_ml, lot_record.qty_ml);
        
        -- Atualizar lote
        UPDATE inventory_lots 
        SET qty_ml = qty_ml - consume_ml
        WHERE id = lot_record.id;
        
        -- Registrar movimentação
        INSERT INTO stock_movements (
          perfume_id, 
          inventory_lot_id, 
          movement_type, 
          quantity_ml, 
          unit_cost, 
          total_value, 
          notes,
          user_id
        ) VALUES (
          item_record.perfume_id,
          lot_record.id,
          'sale',
          -consume_ml,
          lot_record.cost_per_ml,
          -(consume_ml * lot_record.cost_per_ml),
          format('Venda - Pedido #%s - %s %s %sml x%s', 
                 NEW.order_number, 
                 item_record.brand, 
                 item_record.name, 
                 item_record.size_ml, 
                 item_record.quantity),
          NEW.user_id
        );
        
        remaining_ml := remaining_ml - consume_ml;
      END LOOP;
      
      -- Verificar se conseguiu consumir todo o estoque necessário
      IF remaining_ml > 0 THEN
        RAISE WARNING 'Estoque insuficiente para perfume %. Faltam %ml', 
                      item_record.name, remaining_ml;
      END IF;
      
      -- Consumir materiais (frascos e etiquetas)
      -- Buscar IDs dos materiais baseado no tamanho
      SELECT id INTO frasco_material_id 
      FROM materials 
      WHERE name = CASE 
        WHEN item_record.size_ml = 2 THEN 'Frasco 2ml'
        WHEN item_record.size_ml = 5 THEN 'Frasco 5ml'
        WHEN item_record.size_ml = 10 THEN 'Frasco 10ml'
        ELSE 'Frasco 50ml'
      END
      AND is_active = true
      LIMIT 1;
      
      SELECT id INTO etiqueta_material_id 
      FROM materials 
      WHERE name = 'Etiqueta Padrão' AND is_active = true
      LIMIT 1;
      
      -- Consumir frascos
      IF frasco_material_id IS NOT NULL THEN
        UPDATE materials 
        SET current_stock = GREATEST(0, current_stock - item_record.quantity)
        WHERE id = frasco_material_id;
        
        INSERT INTO stock_movements (
          material_id,
          movement_type,
          quantity_ml,
          notes,
          user_id
        ) VALUES (
          frasco_material_id,
          'material_consumption',
          -item_record.quantity,
          format('Consumo - Pedido #%s - %s frascos %sml', 
                 NEW.order_number, item_record.quantity, item_record.size_ml),
          NEW.user_id
        );
      END IF;
      
      -- Consumir etiquetas
      IF etiqueta_material_id IS NOT NULL THEN
        UPDATE materials 
        SET current_stock = GREATEST(0, current_stock - item_record.quantity)
        WHERE id = etiqueta_material_id;
        
        INSERT INTO stock_movements (
          material_id,
          movement_type,
          quantity_ml,
          notes,
          user_id
        ) VALUES (
          etiqueta_material_id,
          'material_consumption',
          -item_record.quantity,
          format('Consumo - Pedido #%s - %s etiquetas', 
                 NEW.order_number, item_record.quantity),
          NEW.user_id
        );
      END IF;
      
    END LOOP;
    
    -- Verificar alertas de estoque baixo após movimentações
    PERFORM check_low_stock_alerts();
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para processar movimentação automática
CREATE TRIGGER process_order_stock_movement_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION process_order_stock_movement();

-- Alterar tabela stock_movements para suportar materials
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS material_id UUID REFERENCES materials(id);

-- Função para verificar disponibilidade de estoque antes da venda
CREATE OR REPLACE FUNCTION public.check_stock_availability(perfume_uuid uuid, size_ml_param integer, quantity_requested integer)
RETURNS TABLE(available boolean, available_ml integer, available_units integer, message text) AS $$
DECLARE
  total_ml_available INTEGER;
  units_available INTEGER;
  total_ml_needed INTEGER;
BEGIN
  -- Calcular ML total disponível
  SELECT COALESCE(SUM(qty_ml), 0) INTO total_ml_available
  FROM inventory_lots
  WHERE perfume_id = perfume_uuid AND qty_ml > 0;
  
  -- Calcular quantas unidades podem ser feitas
  units_available := total_ml_available / size_ml_param;
  
  -- ML necessário
  total_ml_needed := size_ml_param * quantity_requested;
  
  RETURN QUERY SELECT 
    units_available >= quantity_requested as available,
    total_ml_available as available_ml,
    units_available as available_units,
    CASE 
      WHEN units_available >= quantity_requested THEN 'Estoque disponível'
      ELSE format('Estoque insuficiente. Disponível: %s unidades (%sml)', units_available, total_ml_available)
    END as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;