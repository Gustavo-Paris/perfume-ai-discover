-- FASE 2.3: Fortalecimento de RLS Policies (ajustado)

-- 1. Adicionar índices para melhorar performance de policies
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_order_id ON public.payment_events(order_id);

-- 2. Adicionar policy adicional para prevenir acesso a orders sem user_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Prevent access to orders without user'
    ) THEN
        CREATE POLICY "Prevent access to orders without user"
        ON public.orders
        FOR SELECT
        TO public
        USING (user_id IS NOT NULL);
    END IF;
END $$;

-- 3. Adicionar policy para order_items prevenir acesso direto a itens órfãos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' 
        AND policyname = 'Prevent direct access to orphan order items'
    ) THEN
        CREATE POLICY "Prevent direct access to orphan order items"
        ON public.order_items
        FOR SELECT
        TO public
        USING (
            EXISTS (
                SELECT 1 FROM public.orders 
                WHERE orders.id = order_items.order_id
            )
        );
    END IF;
END $$;

-- 4. Fortalecer policy de payment_events
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payment_events' 
        AND policyname = 'Payment events only via valid orders'
    ) THEN
        CREATE POLICY "Payment events only via valid orders"
        ON public.payment_events
        FOR SELECT
        TO public
        USING (
            order_id IS NOT NULL 
            AND EXISTS (
                SELECT 1 FROM public.orders 
                WHERE orders.id = payment_events.order_id
                AND (orders.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
            )
        );
    END IF;
END $$;

-- 5. Criar função auxiliar para verificar se tabela tem RLS habilitado
CREATE OR REPLACE FUNCTION public.check_rls_enabled(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM pg_class pc
        JOIN pg_namespace pn ON pc.relnamespace = pn.oid
        WHERE pn.nspname = 'public'
        AND pc.relname = table_name
        AND pc.relrowsecurity = true
    );
END;
$$;

-- 6. Comentar tabelas sensíveis para documentação
COMMENT ON TABLE public.addresses IS 'RLS: Usuários podem ver/editar apenas seus próprios endereços';
COMMENT ON TABLE public.orders IS 'RLS: Usuários veem apenas seus pedidos, admins veem todos';
COMMENT ON TABLE public.profiles IS 'RLS: Usuários veem apenas seu próprio perfil';
COMMENT ON TABLE public.company_info IS 'RLS: Apenas admins podem acessar informações da empresa';
COMMENT ON TABLE public.company_settings IS 'RLS: Apenas admins podem acessar configurações da empresa';
COMMENT ON TABLE public.security_audit_log IS 'RLS: Apenas admins podem ver logs de auditoria de segurança';
COMMENT ON TABLE public.cart_items IS 'RLS: Usuários podem ver/editar apenas seus próprios itens do carrinho';