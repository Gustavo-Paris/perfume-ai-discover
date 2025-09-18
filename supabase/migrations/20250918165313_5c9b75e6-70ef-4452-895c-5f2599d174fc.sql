-- Limpeza completa dos perfumes mantendo materiais intactos
-- Deletar em ordem para respeitar foreign keys

-- 1. Deletar movimentações de estoque
DELETE FROM public.stock_movements;

-- 2. Deletar receitas dos produtos
DELETE FROM public.product_recipes;

-- 3. Deletar preços dos perfumes
DELETE FROM public.perfume_prices;

-- 4. Deletar lotes de perfumes
DELETE FROM public.inventory_lots;

-- 5. Deletar perfumes principais
DELETE FROM public.perfumes;

-- Verificação final - contar registros restantes
-- (comentários para referência, não executam)
-- SELECT 'perfumes' as tabela, COUNT(*) as registros FROM perfumes
-- UNION ALL
-- SELECT 'inventory_lots', COUNT(*) FROM inventory_lots
-- UNION ALL  
-- SELECT 'perfume_prices', COUNT(*) FROM perfume_prices
-- UNION ALL
-- SELECT 'product_recipes', COUNT(*) FROM product_recipes
-- UNION ALL
-- SELECT 'stock_movements', COUNT(*) FROM stock_movements;