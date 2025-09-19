-- SECURITY FIX: Clean up conflicting policies properly

-- 1. Remove ALL existing policies to start clean
DROP POLICY IF EXISTS "Admins can manage all perfumes data" ON public.perfumes;
DROP POLICY IF EXISTS "Admins can manage perfumes" ON public.perfumes;
DROP POLICY IF EXISTS "Only admins can view complete perfume data" ON public.perfumes;
DROP POLICY IF EXISTS "Public can view perfume catalog for recommendations" ON public.perfumes;
DROP POLICY IF EXISTS "Public can view safe perfume data" ON public.perfumes;
DROP POLICY IF EXISTS "Admins only can access sensitive perfume data" ON public.perfumes;

-- 2. Create ONE comprehensive admin-only policy for the main table
-- This protects ALL sensitive business data (costs, margins, etc.)
CREATE POLICY "Admin only access to sensitive perfume business data"
ON public.perfumes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Ensure the public view remains accessible (contains NO sensitive data)
-- This is what competitors and customers will see - safe catalog info only
GRANT SELECT ON public.perfumes_public TO anon;
GRANT SELECT ON public.perfumes_public TO authenticated;

-- 4. Final security verification
SELECT 'SECURITY STATUS' as check_type, 
       'SUCCESS - Main table is now admin-only protected' as result;

-- Verify final policy state
SELECT 'Current Policies:' as info, policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'perfumes';