-- Verificar e corrigir políticas RLS para pedidos
-- Permitir que admins vejam todos os pedidos

-- Primeiro, verificar se existe uma política para admins verem todos os pedidos
DO $$ 
BEGIN
  -- Remover política existente se houver problema
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'orders' 
    AND policyname = 'Admins can view all orders'
  ) THEN
    DROP POLICY "Admins can view all orders" ON public.orders;
  END IF;
END $$;

-- Criar política para admins verem todos os pedidos
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);

-- Verificar se existe política para admins gerenciarem todos os pedidos
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'orders' 
    AND policyname = 'Admins can manage all orders'
  ) THEN
    DROP POLICY "Admins can manage all orders" ON public.orders;
  END IF;
END $$;

-- Criar política para admins gerenciarem todos os pedidos
CREATE POLICY "Admins can manage all orders"
ON public.orders
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);

-- Verificar a política para order_items também
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'order_items' 
    AND policyname = 'Admins can view all order items'
  ) THEN
    DROP POLICY "Admins can view all order items" ON public.order_items;
  END IF;
END $$;

-- Criar política para admins verem todos os order_items
CREATE POLICY "Admins can view all order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);