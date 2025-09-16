-- Atualizar estoque dos materiais com base nos lotes existentes
UPDATE materials 
SET current_stock = (
  SELECT COALESCE(SUM(ml.quantity), 0)
  FROM material_lots ml 
  WHERE ml.material_id = materials.id
)
WHERE id IN (
  SELECT DISTINCT material_id FROM material_lots
);