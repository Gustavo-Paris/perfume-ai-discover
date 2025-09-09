-- Limpar dados de exemplo existentes
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

-- Inserir perfumes baseados na planilha
INSERT INTO perfumes (name, brand, description, family, gender, price_5ml, price_10ml, price_full, category, avg_cost_per_ml) VALUES
('Clube de nuit Feminino', 'Armaf', 'Inspiração em perfume feminino clássico', 'Oriental', 'Feminino', 11.30, 22.60, 199.99, 'Premium', 2.26),
('Orientica Amber Rouge', 'Orientica', 'Fragrância âmbar intensa', 'Oriental', 'Unissex', 14.20, 28.40, 399.99, 'Premium', 2.84),
('Supremacy Collector''s', 'Afnan', 'Edição colecionador', 'Oriental', 'Masculino', 13.55, 27.10, 244.99, 'Premium', 2.71),
('Turathi Blue', 'Ard Al Zaafaran', 'Fragrância fresca e azul', 'Fresca', 'Masculino', 14.78, 29.55, 239.99, 'Premium', 2.96),
('Orientica Royal Amber', 'Orientica', 'Âmbar real luxuoso', 'Oriental', 'Unissex', 31.00, 62.00, 469.99, 'Luxury', 6.20),
('Eternal Oud', 'Lattafa', 'Oud eterno e marcante', 'Oriental', 'Unissex', 9.17, 18.34, 169.99, 'Premium', 1.83),
('Azzure Aoud', 'Maison Alhambra', 'Oud azul sofisticado', 'Oriental', 'Unissex', 15.17, 30.34, 289.99, 'Premium', 3.03),
('Vulcan Feu', 'Fragrance World', 'Fogo vulcânico intenso', 'Oriental', 'Masculino', 15.17, 30.34, 289.99, 'Premium', 3.03),
('Yara Tous', 'Gostar', 'Inspiração feminina doce', 'Floral', 'Feminino', 7.67, 15.34, 139.99, 'Premium', 1.53),
('Yara Moi', 'Gostar', 'Versão intensa do Yara', 'Floral', 'Feminino', 7.67, 15.34, 139.99, 'Premium', 1.53),
('Liquid Brun', 'Fragrance World', 'Líquido marrom intenso', 'Oriental', 'Unissex', 15.17, 30.34, 289.99, 'Premium', 3.03),
('Eclaire', 'Al Haramain', 'Fragrância luminosa', 'Fresca', 'Unissex', 11.17, 22.34, 209.99, 'Premium', 2.23),
('Victoria', 'Secret', 'Perfume feminino clássico', 'Floral', 'Feminino', 12.67, 25.34, 239.99, 'Premium', 2.53),
('Lattafa Asad EDP', 'Lattafa', 'Leão - força e poder', 'Oriental', 'Masculino', 8.21, 16.42, 149.99, 'Premium', 1.64),
('Lattafa Yara EDP', 'Lattafa', 'Doce e feminino', 'Floral', 'Feminino', 11.21, 22.42, 219.99, 'Premium', 2.24),
('Sabah Al Ward', 'Al Haramain', 'Manhã das rosas', 'Floral', 'Feminino', 9.01, 18.02, 159.99, 'Premium', 1.80),
('Bade''s Al Oud', 'Bade''s', 'Oud tradicional', 'Oriental', 'Unissex', 8.01, 16.02, 145.99, 'Premium', 1.60),
('Clube de nuit Intense', 'Armaf', 'Versão intensa masculina', 'Oriental', 'Masculino', 6.44, 12.88, 120.99, 'Premium', 1.29),
('Yara Candy', 'Gostar', 'Doce como bala', 'Floral', 'Feminino', 6.71, 13.42, 119.99, 'Premium', 1.34),
('Atheeri', 'Al Haramain', 'Fragrância etérea', 'Oriental', 'Unissex', 14.71, 29.42, 279.99, 'Premium', 2.94),
('Classic Stone', 'Fragrance World', 'Pedra clássica', 'Oriental', 'Masculino', 14.21, 28.42, 269.99, 'Premium', 2.84),
('Liquid Brun Homme', 'Fragrance World', 'Líquido marrom masculino', 'Oriental', 'Masculino', 18.21, 36.42, 349.99, 'Premium', 3.64),
('Givenchy Gent', 'Inspired', 'Inspiração Givenchy', 'Fresca', 'Masculino', 26.69, 53.38, 499.56, 'Luxury', 5.34),
('Goddess', 'Inspired', 'Deusa feminina', 'Floral', 'Feminino', 26.69, 53.38, 499.56, 'Luxury', 5.34),
('Delina', 'Inspired', 'Inspiração Parfums de Marly', 'Floral', 'Feminino', 109.77, 219.55, 1612.40, 'Ultra Luxury', 21.95),
('Hombre Leather', 'Inspired', 'Couro masculino', 'Oriental', 'Masculino', 73.99, 147.98, 1445.60, 'Ultra Luxury', 14.80),
('Oud Gourmand 85ml', 'Inspired', 'Oud gourmand', 'Oriental', 'Unissex', 31.45, 62.90, 500.40, 'Luxury', 6.29),
('Amana 85ml', 'Inspired', 'Fragrância amadeirada', 'Oriental', 'Unissex', 31.45, 62.90, 500.40, 'Luxury', 6.29),
('Sospiro Erba Magica', 'Inspired', 'Erva mágica', 'Fresca', 'Unissex', 57.31, 114.62, 1112.00, 'Ultra Luxury', 11.46),
('Scandal Absolut', 'Inspired', 'Escândalo absoluto', 'Oriental', 'Feminino', 24.54, 49.08, 456.62, 'Luxury', 4.91),
('Fakhar', 'Inspired', 'Orgulho oriental', 'Oriental', 'Masculino', 7.78, 15.56, 121.38, 'Premium', 1.56),
('Asad Bourbon', 'Inspired', 'Bourbon masculino', 'Oriental', 'Masculino', 8.21, 16.43, 130.05, 'Premium', 1.64),
('Atheeri Paraguai', 'Import', 'Atheeri importado', 'Oriental', 'Unissex', 9.33, 18.65, 152.30, 'Premium', 1.87),
('Club de Nuit Maleka', 'Import', 'Versão feminina importada', 'Oriental', 'Feminino', 11.83, 23.65, 202.30, 'Premium', 2.37),
('Orientica Azure Fantasy', 'Import', 'Fantasia azul', 'Fresca', 'Unissex', 21.28, 42.57, 306.34, 'Premium', 4.26),
('Orientica Royal Victory', 'Import', 'Vitória real', 'Oriental', 'Unissex', 29.23, 58.46, 433.50, 'Luxury', 5.85),
('Prada Paradoxe Intense', 'Import', 'Paradoxo intenso', 'Floral', 'Feminino', 43.97, 87.93, 757.18, 'Ultra Luxury', 8.79);