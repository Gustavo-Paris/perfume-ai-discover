-- ============================================
-- FASE 1.1: Corrigir RLS em tabelas sensíveis
-- ============================================

-- 1. PROFILES: Garantir isolamento total entre usuários
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can only view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can only update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can only insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 2. ADDRESSES: Reforçar isolamento + audit log
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Deny unauthenticated access to addresses" ON public.addresses;

CREATE POLICY "Users can only view their own addresses"
ON public.addresses FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own addresses"
ON public.addresses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own addresses"
ON public.addresses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own addresses"
ON public.addresses FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 3. COMPANY_INFO: Apenas admins podem visualizar dados sensíveis
DROP POLICY IF EXISTS "Admins can manage company info" ON public.company_info;

CREATE POLICY "Only admins can view company info"
ON public.company_info FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update company info"
ON public.company_info FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert company info"
ON public.company_info FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. COMPANY_SETTINGS: Mesma proteção
DROP POLICY IF EXISTS "Admins can manage company settings" ON public.company_settings;

CREATE POLICY "Only admins can view company settings"
ON public.company_settings FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update company settings"
ON public.company_settings FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert company settings"
ON public.company_settings FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. ORDER_ITEMS: Garantir que usuários só vejam itens de seus próprios pedidos
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create their own order items" ON public.order_items;

CREATE POLICY "Users can only view their own order items"
ON public.order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can only insert their own order items"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- 6. CART_ITEMS: Adicionar RLS se não existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'cart_items'
  ) THEN
    RAISE NOTICE 'cart_items table does not exist, skipping';
  ELSE
    -- Enable RLS
    ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Users can manage their own cart items" ON public.cart_items;
    
    -- Create new policies
    CREATE POLICY "Users can only view their own cart items"
    ON public.cart_items FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can only insert their own cart items"
    ON public.cart_items FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can only update their own cart items"
    ON public.cart_items FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can only delete their own cart items"
    ON public.cart_items FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 7. Criar índices para performance das policies
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 8. Comentários de auditoria
COMMENT ON POLICY "Users can only view their own profile" ON public.profiles IS 
'FASE 1.1: Isolamento total entre usuários - cada um vê apenas seu próprio perfil';

COMMENT ON POLICY "Users can only view their own addresses" ON public.addresses IS 
'FASE 1.1: Proteção de PII - endereços completamente isolados por usuário';

COMMENT ON POLICY "Only admins can view company info" ON public.company_info IS 
'FASE 1.1: Dados sensíveis da empresa acessíveis apenas para administradores';