-- Resetar dados de teste para estado original (ordem correta)
-- Deletar primeiro as movimentações que referenciam pedidos
DELETE FROM stock_movements;
DELETE FROM material_movements;

-- Agora deletar pedidos e itens relacionados
DELETE FROM order_items;
DELETE FROM orders;

-- Deletar receitas de produtos
DELETE FROM product_recipes;

-- Resetar estoques de materiais para valores originais
UPDATE materials 
SET current_stock = 
  CASE 
    WHEN name = 'Frasco 2ml' THEN 500
    WHEN name = 'Frasco 5ml' THEN 300  
    WHEN name = 'Frasco 10ml' THEN 200
    WHEN name = 'Etiqueta Padrão' THEN 1000
    WHEN name = 'Caixa' THEN 100
    ELSE current_stock
  END
WHERE name IN ('Frasco 2ml', 'Frasco 5ml', 'Frasco 10ml', 'Etiqueta Padrão', 'Caixa');

-- Resetar volumes de perfumes nos lotes para valores originais
UPDATE inventory_lots 
SET qty_ml = 
  CASE 
    WHEN lot_code = 'LOT001' THEN 500  -- Amana
    WHEN lot_code = 'LOT002' THEN 750  -- Amber Rouge  
    WHEN lot_code = 'LOT003' THEN 600  -- Azzure Aoud
    ELSE qty_ml
  END
WHERE lot_code IN ('LOT001', 'LOT002', 'LOT003');

-- Recalcular custos médios dos perfumes
UPDATE perfumes 
SET avg_cost_per_ml = (
  SELECT COALESCE(
    SUM(il.cost_per_ml * il.qty_ml) / NULLIF(SUM(il.qty_ml), 0), 
    0
  )
  FROM inventory_lots il 
  WHERE il.perfume_id = perfumes.id
    AND il.qty_ml > 0
);