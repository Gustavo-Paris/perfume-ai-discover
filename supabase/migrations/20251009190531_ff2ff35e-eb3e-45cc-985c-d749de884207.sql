-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA
-- Corrigir exposição pública de dados de pedidos e cupons

-- ============================================
-- 1.1. CORRIGIR RLS DA TABELA ORDERS
-- ============================================
-- Remover política perigosa que permite acesso público a todos os pedidos
DROP POLICY IF EXISTS "Prevent access to orders without user" ON public.orders;

-- As políticas corretas já existem:
-- ✓ "Users can view their own orders" - usuários veem seus pedidos
-- ✓ "Admins can view all orders" - admins veem tudo
-- ✓ Não há necessidade de política pública


-- ============================================
-- 1.2. CORRIGIR RLS DA TABELA ORDER_ITEMS
-- ============================================
-- Remover política perigosa que permite acesso público a todos os itens de pedido
DROP POLICY IF EXISTS "Prevent direct access to orphan order items" ON public.order_items;

-- As políticas corretas já existem:
-- ✓ "Users can only view their own order items" - usuários veem seus itens
-- ✓ "Admins can view all order items" - admins veem tudo


-- ============================================
-- 1.3. RESTRINGIR ACESSO AOS CUPONS
-- ============================================
-- Remover acesso público aos cupons
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;

-- Criar nova política: apenas usuários autenticados podem ver cupons ativos
CREATE POLICY "Authenticated users can view active coupons" 
ON public.coupons 
FOR SELECT 
TO authenticated 
USING (is_active = true);

-- Admins continuam com acesso total via política existente "Admins can manage coupons"


-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- ✅ Pedidos: acessíveis apenas pelo dono ou admin
-- ✅ Itens de pedido: acessíveis apenas pelo dono ou admin  
-- ✅ Cupons: visíveis apenas para usuários autenticados
-- ✅ Zero exposição de PII para não autenticados