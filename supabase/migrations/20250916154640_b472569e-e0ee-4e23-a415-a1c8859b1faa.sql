-- Criar receitas padrão para produtos existentes que não têm receitas
-- Primeiro, vamos criar as receitas para os tamanhos 2ml, 5ml e 10ml

-- Para 2ml: 1 frasco 2ml + 1 etiqueta
INSERT INTO product_recipes (perfume_id, size_ml, material_id, quantity_needed)
SELECT 
  p.id as perfume_id,
  2 as size_ml,
  m.id as material_id,
  1 as quantity_needed
FROM perfumes p
CROSS JOIN materials m
WHERE m.name = 'Frasco 2ml' 
  AND NOT EXISTS (
    SELECT 1 FROM product_recipes pr 
    WHERE pr.perfume_id = p.id AND pr.size_ml = 2 AND pr.material_id = m.id
  );

INSERT INTO product_recipes (perfume_id, size_ml, material_id, quantity_needed)
SELECT 
  p.id as perfume_id,
  2 as size_ml,
  m.id as material_id,
  1 as quantity_needed
FROM perfumes p
CROSS JOIN materials m
WHERE m.name = 'Etiqueta Padrão'
  AND NOT EXISTS (
    SELECT 1 FROM product_recipes pr 
    WHERE pr.perfume_id = p.id AND pr.size_ml = 2 AND pr.material_id = m.id
  );

-- Para 5ml: 1 frasco 5ml + 1 etiqueta
INSERT INTO product_recipes (perfume_id, size_ml, material_id, quantity_needed)
SELECT 
  p.id as perfume_id,
  5 as size_ml,
  m.id as material_id,
  1 as quantity_needed
FROM perfumes p
CROSS JOIN materials m
WHERE m.name = 'Frasco 5ml'
  AND NOT EXISTS (
    SELECT 1 FROM product_recipes pr 
    WHERE pr.perfume_id = p.id AND pr.size_ml = 5 AND pr.material_id = m.id
  );

INSERT INTO product_recipes (perfume_id, size_ml, material_id, quantity_needed)
SELECT 
  p.id as perfume_id,
  5 as size_ml,
  m.id as material_id,
  1 as quantity_needed
FROM perfumes p
CROSS JOIN materials m
WHERE m.name = 'Etiqueta Padrão'
  AND NOT EXISTS (
    SELECT 1 FROM product_recipes pr 
    WHERE pr.perfume_id = p.id AND pr.size_ml = 5 AND pr.material_id = m.id
  );

-- Para 10ml: 1 frasco 10ml + 1 etiqueta
INSERT INTO product_recipes (perfume_id, size_ml, material_id, quantity_needed)
SELECT 
  p.id as perfume_id,
  10 as size_ml,
  m.id as material_id,
  1 as quantity_needed
FROM perfumes p
CROSS JOIN materials m
WHERE m.name = 'Frasco 10ml'
  AND NOT EXISTS (
    SELECT 1 FROM product_recipes pr 
    WHERE pr.perfume_id = p.id AND pr.size_ml = 10 AND pr.material_id = m.id
  );

INSERT INTO product_recipes (perfume_id, size_ml, material_id, quantity_needed)
SELECT 
  p.id as perfume_id,
  10 as size_ml,
  m.id as material_id,
  1 as quantity_needed
FROM perfumes p
CROSS JOIN materials m
WHERE m.name = 'Etiqueta Padrão'
  AND NOT EXISTS (
    SELECT 1 FROM product_recipes pr 
    WHERE pr.perfume_id = p.id AND pr.size_ml = 10 AND pr.material_id = m.id
  );

-- Atualizar receitas existentes com quantity_needed = 0 para usar 1
UPDATE product_recipes 
SET quantity_needed = 1 
WHERE quantity_needed = 0;