-- Atualizar margens de lucro por categoria
UPDATE perfumes 
SET target_margin_percentage = 0.80 
WHERE category = 'Premium';

UPDATE perfumes 
SET target_margin_percentage = 0.60 
WHERE category = 'Luxury';

-- Ultra Luxury já está com 0.40, mantemos o mesmo

-- Recalcular todos os preços baseado nas novas margens
SELECT public.recalculate_all_prices();