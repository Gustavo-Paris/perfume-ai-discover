-- Atualizar margens de lucro por categoria
UPDATE perfumes 
SET target_margin_percentage = 0.50 
WHERE category = 'Premium';

UPDATE perfumes 
SET target_margin_percentage = 0.45 
WHERE category = 'Luxury';

UPDATE perfumes 
SET target_margin_percentage = 0.40 
WHERE category = 'Ultra Luxury';

-- Recalcular todos os preços baseado nas novas margens
SELECT public.recalculate_all_prices();