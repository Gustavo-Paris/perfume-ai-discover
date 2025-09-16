-- Limpar dados para teste do novo sistema de cadastro
-- Deletar na ordem correta para evitar problemas de foreign keys

-- 1. Deletar movimentações de estoque
DELETE FROM public.stock_movements;

-- 2. Deletar itens de pedidos (se houver)
DELETE FROM public.order_items 
WHERE perfume_id IN (SELECT id FROM public.perfumes);

-- 3. Deletar reservas
DELETE FROM public.reservations;

-- 4. Deletar lotes de inventário
DELETE FROM public.inventory_lots;

-- 5. Deletar lotes de materiais
DELETE FROM public.material_lots;

-- 6. Deletar receitas de produtos
DELETE FROM public.product_recipes;

-- 7. Deletar promoções
DELETE FROM public.promotions;

-- 8. Deletar reviews de perfumes
DELETE FROM public.reviews 
WHERE perfume_id IN (SELECT id FROM public.perfumes);

-- 9. Deletar interações com perfumes
DELETE FROM public.perfume_interactions 
WHERE perfume_id IN (SELECT id FROM public.perfumes);

-- 10. Deletar itens da wishlist
DELETE FROM public.wishlist 
WHERE perfume_id IN (SELECT id FROM public.perfumes);

-- 11. Deletar itens do carrinho
DELETE FROM public.cart_items 
WHERE perfume_id IN (SELECT id FROM public.perfumes);

-- 12. Deletar perfumes
DELETE FROM public.perfumes;

-- 13. Deletar materiais
DELETE FROM public.materials;

-- 14. Resetar configurações de alerta de estoque
DELETE FROM public.stock_alert_configs;

-- 15. Deletar histórico de alertas de estoque
DELETE FROM public.stock_alert_history;

-- 16. Deletar regras de empacotamento
DELETE FROM public.packaging_rules;

-- Resetar sequências se necessário
-- (As sequences são mantidas automaticamente pelo gen_random_uuid())

-- Log da operação
INSERT INTO public.access_logs (user_id, route, ip_address, user_agent)
VALUES (
  auth.uid(),
  'admin/data-cleanup',
  inet_client_addr(),
  'System cleanup for testing'
);