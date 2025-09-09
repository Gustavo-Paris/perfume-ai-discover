-- Primeiro, limpar dados existentes
DELETE FROM product_recipes;
DELETE FROM inventory_lots;
DELETE FROM stock_movements;
DELETE FROM materials WHERE id NOT IN (SELECT container_material_id FROM packaging_rules);
DELETE FROM perfumes;

-- Inserir materiais baseados na planilha
INSERT INTO materials (name, type, category, unit, cost_per_unit, current_stock, min_stock_alert, supplier, description) VALUES
-- Frascos
('Frasco 2ml', 'input', 'embalagem', 'unidade', 2.00, 100, 20, 'Fornecedor Local', 'Frasco vazio 2ml'),
('Frasco 5ml', 'input', 'embalagem', 'unidade', 4.00, 100, 20, 'Fornecedor Local', 'Frasco vazio 5ml'),
('Frasco 10ml', 'input', 'embalagem', 'unidade', 5.50, 100, 20, 'Fornecedor Local', 'Frasco vazio 10ml'),
-- Etiquetas
('Etiqueta 5ml', 'input', 'embalagem', 'unidade', 0.27, 500, 50, 'Fornecedor Local', 'Etiqueta adesiva 5ml'),
('Etiqueta 10ml', 'input', 'embalagem', 'unidade', 0.27, 500, 50, 'Fornecedor Local', 'Etiqueta adesiva 10ml'),
-- Caixa
('Caixa', 'input', 'embalagem', 'unidade', 5.50, 50, 10, 'Fornecedor Local', 'Caixa para envio');