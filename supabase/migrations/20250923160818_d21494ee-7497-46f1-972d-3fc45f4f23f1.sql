-- Corrigir volumes dos perfumes nos lotes com códigos corretos
UPDATE inventory_lots 
SET qty_ml = 
  CASE 
    WHEN lot_code = 'Amana-0001' THEN 500  -- Amana
    WHEN lot_code = 'Amber-Rouge-0001' THEN 750  -- Amber Rouge  
    ELSE qty_ml
  END
WHERE lot_code IN ('Amana-0001', 'Amber-Rouge-0001');

-- Recalcular custos médios dos perfumes afetados
UPDATE perfumes 
SET avg_cost_per_ml = (
  SELECT COALESCE(
    SUM(il.cost_per_ml * il.qty_ml) / NULLIF(SUM(il.qty_ml), 0), 
    0
  )
  FROM inventory_lots il 
  WHERE il.perfume_id = perfumes.id
    AND il.qty_ml > 0
)
WHERE name IN ('Amana', 'Amber Rouge');