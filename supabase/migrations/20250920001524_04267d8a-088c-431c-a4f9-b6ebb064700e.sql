-- TARGETED SECURITY FIX: Address specific business data exposure

-- 1. Fix perfume_prices public access (only if the problematic policy exists)
DO $$
BEGIN
  -- Check if the public policy exists and replace it
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'perfume_prices' 
    AND policyname = 'Anyone can view perfume prices'
  ) THEN
    DROP POLICY "Anyone can view perfume prices" ON public.perfume_prices;
    
    -- Create secure policy for authenticated users only
    CREATE POLICY "Authenticated users can view perfume prices"
    ON public.perfume_prices
    FOR SELECT
    TO authenticated
    USING (true);
    
    RAISE NOTICE '✅ Fixed: Perfume pricing data now protected from competitors';
  ELSE
    RAISE NOTICE '⚠️ Perfume pricing policy already secure or not found';
  END IF;
END $$;

-- 2. Fix popular_searches public access
DO $$
BEGIN
  -- Remove any existing public access policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'popular_searches' 
    AND policyname = 'Everyone can view popular searches'
  ) THEN
    DROP POLICY "Everyone can view popular searches" ON public.popular_searches;
    RAISE NOTICE '✅ Removed: Public access to search analytics blocked';
  END IF;
  
  -- Create admin-only policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'popular_searches' 
    AND policyname = 'Admins can view popular searches'
  ) THEN
    CREATE POLICY "Admins can view popular searches"
    ON public.popular_searches
    FOR SELECT
    TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role));
    
    RAISE NOTICE '✅ Created: Admin-only access to search analytics';
  END IF;
END $$;

-- 3. Fix local_delivery_settings public access
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'local_delivery_settings' 
    AND policyname = 'Everyone can view local delivery settings'
  ) THEN
    DROP POLICY "Everyone can view local delivery settings" ON public.local_delivery_settings;
    
    CREATE POLICY "Authenticated users can view delivery settings"
    ON public.local_delivery_settings
    FOR SELECT
    TO authenticated
    USING (true);
    
    RAISE NOTICE '✅ Fixed: Delivery settings now protected from competitors';
  ELSE
    RAISE NOTICE '⚠️ Delivery settings policy already secure or not found';
  END IF;
END $$;

-- 4. Optional: Fix legal_documents if it exists and is public
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'legal_documents'
  ) AND EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'legal_documents' 
    AND policyname LIKE '%Everyone%' OR policyname LIKE '%public%'
  ) THEN
    -- Could implement policy changes for legal documents here if needed
    RAISE NOTICE '⚠️ Legal documents table found - consider restricting access';
  END IF;
END $$;

-- 5. Final verification
DO $$
DECLARE
  exposed_tables text := '';
BEGIN
  -- Check if any business-sensitive tables are still publicly accessible
  SET ROLE anon;
  
  -- Test each table and collect results
  BEGIN
    PERFORM 1 FROM perfume_prices LIMIT 1;
    exposed_tables := exposed_tables || 'perfume_prices ';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL; -- Good, access blocked
  END;
  
  BEGIN
    PERFORM 1 FROM popular_searches LIMIT 1;
    exposed_tables := exposed_tables || 'popular_searches ';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL; -- Good, access blocked
  END;
  
  BEGIN
    PERFORM 1 FROM local_delivery_settings LIMIT 1;
    exposed_tables := exposed_tables || 'local_delivery_settings ';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL; -- Good, access blocked
  END;
  
  RESET ROLE;
  
  IF exposed_tables = '' THEN
    RAISE NOTICE '🔒 SECURITY SUCCESS: All business-sensitive data is now protected';
  ELSE
    RAISE NOTICE '⚠️ REMAINING EXPOSURE: Tables still public: %', exposed_tables;
  END IF;
END $$;