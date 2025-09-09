-- Adicionar colunas para tamanho 2ml e margens personalizadas
ALTER TABLE perfumes 
ADD COLUMN IF NOT EXISTS price_2ml numeric,
ADD COLUMN IF NOT EXISTS target_margin_percentage numeric DEFAULT 0.50;

-- Atualizar margens por categoria
UPDATE perfumes 
SET target_margin_percentage = CASE 
  WHEN category = 'Premium' THEN 0.47
  WHEN category = 'Luxury' THEN 0.57  
  WHEN category = 'Ultra Luxury' THEN 0.65
  ELSE 0.50
END;

-- Calcular preços 2ml para Ultra Luxury (baseado no custo + margem)
UPDATE perfumes 
SET price_2ml = ROUND((avg_cost_per_ml * 2) / (1 - target_margin_percentage), 2)
WHERE category = 'Ultra Luxury';

-- Adicionar materiais para frascos 2ml
INSERT INTO materials (name, type, category, unit, cost_per_unit, current_stock, supplier, description) VALUES
('Frasco 2ml Cristal', 'input', 'embalagem', 'unidade', 0.80, 500, 'Embalagens Premium', 'Frasco miniatura em cristal para amostras premium'),
('Etiqueta 2ml Premium', 'input', 'rotulagem', 'unidade', 0.15, 1000, 'Gráfica Especializada', 'Etiqueta especial para frascos 2ml');

-- Criar receitas para produção 2ml (Ultra Luxury apenas)
INSERT INTO product_recipes (perfume_id, size_ml, material_id, quantity_needed)
SELECT 
  p.id,
  2,
  m.id,
  CASE 
    WHEN m.name = 'Frasco 2ml Cristal' THEN 1
    WHEN m.name = 'Etiqueta 2ml Premium' THEN 1
    ELSE 0
  END
FROM perfumes p
CROSS JOIN materials m
WHERE p.category = 'Ultra Luxury'
AND m.name IN ('Frasco 2ml Cristal', 'Etiqueta 2ml Premium');