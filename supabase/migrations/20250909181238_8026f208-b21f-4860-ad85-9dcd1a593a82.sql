-- ESTRUTURA COMPLETA DE PRECIFICAÇÃO
-- 1. Corrigir margens de lucro por categoria
UPDATE perfumes SET target_margin_percentage = CASE 
  WHEN category = 'Premium' THEN 0.60    -- 60% margem
  WHEN category = 'Luxury' THEN 0.55     -- 55% margem  
  WHEN category = 'Ultra Luxury' THEN 0.50 -- 50% margem
  ELSE 0.60
END;

-- 2. Completar materiais de embalagem (adicionar os que faltam)
INSERT INTO materials (name, type, category, unit, cost_per_unit, supplier, description) VALUES
('Frasco 50ml Premium', 'input', 'packaging', 'unidade', 10.00, 'Fornecedor Vidros', 'Frasco de vidro premium para 50ml'),
('Etiqueta 50ml Premium', 'input', 'packaging', 'unidade', 0.80, 'Gráfica Premium', 'Etiqueta premium para frasco 50ml'),
('Papel Seda Proteção', 'input', 'packaging', 'unidade', 0.30, 'Papelaria Luxo', 'Papel seda para proteção do produto'),
('Fita Adesiva', 'input', 'packaging', 'unidade', 0.15, 'Suprimentos Gerais', 'Fita para vedação da embalagem');

-- 3. Atualizar custos dos materiais existentes para valores mais realistas
UPDATE materials SET cost_per_unit = CASE name
  WHEN 'Frasco 5ml' THEN 2.50
  WHEN 'Frasco 10ml' THEN 3.50  
  WHEN 'Frasco 2ml' THEN 1.80
  WHEN 'Etiqueta 5ml' THEN 0.25
  WHEN 'Etiqueta 10ml' THEN 0.30
  WHEN 'Etiqueta 2ml' THEN 0.20
  WHEN 'Caixa Individual' THEN 1.20
  ELSE cost_per_unit
END;

-- 4. Criar regras de embalagem para todos os tamanhos
DELETE FROM packaging_rules; -- Limpar regras antigas
INSERT INTO packaging_rules (container_material_id, max_items, item_size_ml, priority, is_active) 
SELECT m.id, 1, 2, 1, true FROM materials m WHERE m.name = 'Caixa Individual'
UNION ALL
SELECT m.id, 1, 5, 1, true FROM materials m WHERE m.name = 'Caixa Individual' 
UNION ALL
SELECT m.id, 1, 10, 1, true FROM materials m WHERE m.name = 'Caixa Individual'
UNION ALL
SELECT m.id, 1, 50, 1, true FROM materials m WHERE m.name = 'Caixa Individual';

-- 5. Criar receitas completas para TODOS os perfumes e tamanhos
-- Primeiro limpar receitas existentes
DELETE FROM product_recipes;

-- Criar receitas para tamanho 2ml (apenas Ultra Luxury)
INSERT INTO product_recipes (perfume_id, size_ml, material_id, quantity_needed)
SELECT 
  p.id as perfume_id,
  2 as size_ml,
  m.id as material_id,
  CASE m.name
    WHEN 'Frasco 2ml' THEN 1
    WHEN 'Etiqueta 2ml' THEN 1
    WHEN 'Caixa Individual' THEN 1
    WHEN 'Papel Seda Proteção' THEN 1
    ELSE 0
  END as quantity_needed
FROM perfumes p
CROSS JOIN materials m
WHERE p.category = 'Ultra Luxury' 
  AND m.name IN ('Frasco 2ml', 'Etiqueta 2ml', 'Caixa Individual', 'Papel Seda Proteção')
  AND m.type = 'input';

-- Criar receitas para tamanho 5ml (todas as categorias)
INSERT INTO product_recipes (perfume_id, size_ml, material_id, quantity_needed)
SELECT 
  p.id as perfume_id,
  5 as size_ml,
  m.id as material_id,
  CASE m.name
    WHEN 'Frasco 5ml' THEN 1
    WHEN 'Etiqueta 5ml' THEN 1
    WHEN 'Caixa Individual' THEN 1
    WHEN 'Papel Seda Proteção' THEN 1
    ELSE 0
  END as quantity_needed
FROM perfumes p
CROSS JOIN materials m
WHERE m.name IN ('Frasco 5ml', 'Etiqueta 5ml', 'Caixa Individual', 'Papel Seda Proteção')
  AND m.type = 'input';

-- Criar receitas para tamanho 10ml (todas as categorias)  
INSERT INTO product_recipes (perfume_id, size_ml, material_id, quantity_needed)
SELECT 
  p.id as perfume_id,
  10 as size_ml,
  m.id as material_id,
  CASE m.name
    WHEN 'Frasco 10ml' THEN 1
    WHEN 'Etiqueta 10ml' THEN 1
    WHEN 'Caixa Individual' THEN 1
    WHEN 'Papel Seda Proteção' THEN 1
    ELSE 0
  END as quantity_needed
FROM perfumes p
CROSS JOIN materials m
WHERE m.name IN ('Frasco 10ml', 'Etiqueta 10ml', 'Caixa Individual', 'Papel Seda Proteção')
  AND m.type = 'input';

-- Criar receitas para tamanho 50ml (todas as categorias)
INSERT INTO product_recipes (perfume_id, size_ml, material_id, quantity_needed)
SELECT 
  p.id as perfume_id,
  50 as size_ml,
  m.id as material_id,
  CASE m.name
    WHEN 'Frasco 50ml Premium' THEN 1
    WHEN 'Etiqueta 50ml Premium' THEN 1
    WHEN 'Caixa Individual' THEN 1
    WHEN 'Papel Seda Proteção' THEN 2
    WHEN 'Fita Adesiva' THEN 1
    ELSE 0
  END as quantity_needed
FROM perfumes p
CROSS JOIN materials m
WHERE m.name IN ('Frasco 50ml Premium', 'Etiqueta 50ml Premium', 'Caixa Individual', 'Papel Seda Proteção', 'Fita Adesiva')
  AND m.type = 'input';

-- 6. Recalcular TODOS os preços usando a função de cálculo de custo
-- Criar função para atualizar preços automaticamente
CREATE OR REPLACE FUNCTION recalculate_all_prices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  perfume_record RECORD;
  cost_result RECORD;
BEGIN
  -- Para cada perfume, recalcular preços para todos os tamanhos
  FOR perfume_record IN SELECT id FROM perfumes LOOP
    
    -- Calcular preço para 2ml (só Ultra Luxury)
    IF EXISTS (SELECT 1 FROM perfumes WHERE id = perfume_record.id AND category = 'Ultra Luxury') THEN
      SELECT * INTO cost_result 
      FROM calculate_product_total_cost(perfume_record.id, 2);
      
      UPDATE perfumes 
      SET price_2ml = cost_result.suggested_price
      WHERE id = perfume_record.id;
    END IF;
    
    -- Calcular preço para 5ml
    SELECT * INTO cost_result 
    FROM calculate_product_total_cost(perfume_record.id, 5);
    
    UPDATE perfumes 
    SET price_5ml = cost_result.suggested_price
    WHERE id = perfume_record.id;
    
    -- Calcular preço para 10ml
    SELECT * INTO cost_result 
    FROM calculate_product_total_cost(perfume_record.id, 10);
    
    UPDATE perfumes 
    SET price_10ml = cost_result.suggested_price
    WHERE id = perfume_record.id;
    
    -- Calcular preço para 50ml
    SELECT * INTO cost_result 
    FROM calculate_product_total_cost(perfume_record.id, 50);
    
    UPDATE perfumes 
    SET price_full = cost_result.suggested_price
    WHERE id = perfume_record.id;
    
  END LOOP;
END;
$$;

-- 7. Executar recálculo de todos os preços
SELECT recalculate_all_prices();

-- 8. Criar trigger para recálculo automático quando custos mudarem
CREATE OR REPLACE FUNCTION trigger_price_recalculation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Recalcular preços quando materiais, receitas ou lotes mudarem
  PERFORM recalculate_all_prices();
  RETURN NEW;
END;
$$;

-- Criar triggers
DROP TRIGGER IF EXISTS recalculate_on_material_change ON materials;
CREATE TRIGGER recalculate_on_material_change
  AFTER UPDATE OF cost_per_unit ON materials
  FOR EACH ROW
  EXECUTE FUNCTION trigger_price_recalculation();

DROP TRIGGER IF EXISTS recalculate_on_recipe_change ON product_recipes;  
CREATE TRIGGER recalculate_on_recipe_change
  AFTER INSERT OR UPDATE OR DELETE ON product_recipes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_price_recalculation();

DROP TRIGGER IF EXISTS recalculate_on_lot_change ON inventory_lots;
CREATE TRIGGER recalculate_on_lot_change
  AFTER INSERT OR UPDATE OF cost_per_ml ON inventory_lots
  FOR EACH ROW
  EXECUTE FUNCTION trigger_price_recalculation();