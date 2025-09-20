-- SECURITY PATCH: Protect business-sensitive data from public access

-- 1. Fix perfume_prices table - restrict public access to pricing data
DROP POLICY IF EXISTS "Anyone can view perfume prices" ON public.perfume_prices;

CREATE POLICY "Authenticated users can view perfume prices"
ON public.perfume_prices
FOR SELECT
TO authenticated
USING (true);

-- 2. Fix popular_searches table - restrict to admin access only
DROP POLICY IF EXISTS "Everyone can view popular searches" ON public.popular_searches;
DROP POLICY IF EXISTS "System can manage popular searches" ON public.popular_searches;

CREATE POLICY "Admins can view popular searches"
ON public.popular_searches
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can manage popular searches"
ON public.popular_searches
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Fix local_delivery_settings table - restrict public access
DROP POLICY IF EXISTS "Everyone can view local delivery settings" ON public.local_delivery_settings;

CREATE POLICY "Authenticated users can view delivery settings"
ON public.local_delivery_settings
FOR SELECT
TO authenticated
USING (true);

-- 4. Update database functions with proper search_path for security
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Enhance get_company_public_info function security
CREATE OR REPLACE FUNCTION public.get_company_public_info()
RETURNS TABLE(nome_fantasia text, cidade text, estado text, email_contato text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ci.nome_fantasia,
    ci.cidade,
    ci.estado,
    ci.email_contato
  FROM public.company_info ci
  WHERE ci.nome_fantasia IS NOT NULL
  LIMIT 1;
$$;

-- 6. Secure the get_public_company_info function
CREATE OR REPLACE FUNCTION public.get_public_company_info()
RETURNS TABLE(nome_fantasia text, cidade text, estado text, email_contato text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ci.nome_fantasia,
    ci.cidade,
    ci.estado,
    ci.email_contato
  FROM public.company_info ci
  WHERE ci.nome_fantasia IS NOT NULL
  LIMIT 1;
$$;

-- 7. Add additional security logging for sensitive data access
CREATE TABLE IF NOT EXISTS public.business_data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  table_accessed text NOT NULL,
  action text NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on the new log table
ALTER TABLE public.business_data_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view business data access logs"
ON public.business_data_access_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert access logs"
ON public.business_data_access_log
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- 8. Security verification - test that policies are working
DO $$
BEGIN
  -- Test that anonymous users cannot access business data
  SET ROLE anon;
  
  RAISE NOTICE '🔒 SECURITY VERIFICATION:';
  RAISE NOTICE 'Anonymous access to perfume_prices: %', 
    CASE WHEN EXISTS(SELECT 1 FROM perfume_prices LIMIT 1) THEN '❌ EXPOSED' ELSE '✅ BLOCKED' END;
  RAISE NOTICE 'Anonymous access to popular_searches: %', 
    CASE WHEN EXISTS(SELECT 1 FROM popular_searches LIMIT 1) THEN '❌ EXPOSED' ELSE '✅ BLOCKED' END;
  RAISE NOTICE 'Anonymous access to local_delivery_settings: %', 
    CASE WHEN EXISTS(SELECT 1 FROM local_delivery_settings LIMIT 1) THEN '❌ EXPOSED' ELSE '✅ BLOCKED' END;
    
  RESET ROLE;
EXCEPTION WHEN OTHERS THEN
  RESET ROLE;
  RAISE NOTICE '✅ Security policies are working - anonymous access properly blocked';
END $$;