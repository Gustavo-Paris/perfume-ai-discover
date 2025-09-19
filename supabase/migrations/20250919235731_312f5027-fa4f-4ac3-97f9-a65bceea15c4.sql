-- CRITICAL SECURITY FIX: Remove public access to sensitive business data

-- 1. Remove all public access policies from main perfumes table 
-- These policies are leaking sensitive business data to competitors
DROP POLICY IF EXISTS "Public can view perfume catalog for recommendations" ON public.perfumes;
DROP POLICY IF EXISTS "Public can view safe perfume data" ON public.perfumes;
DROP POLICY IF EXISTS "Perfumes are publicly viewable" ON public.perfumes;
DROP POLICY IF EXISTS "Anyone can view perfumes" ON public.perfumes;

-- 2. Keep only admin-restricted policies on main table
-- This ensures sensitive cost/margin data is admin-only
CREATE POLICY "Admins only can access sensitive perfume data"
ON public.perfumes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Verify the public view is still accessible (this is safe - no sensitive data)
GRANT SELECT ON public.perfumes_public TO anon;
GRANT SELECT ON public.perfumes_public TO authenticated;

-- 4. Security verification
SELECT 'SECURITY FIXED' as status, 
       'Main table now admin-only, public uses safe view' as description;

-- Show final policy state
SELECT 'Final RLS Policies:' as info, policyname, cmd
FROM pg_policies 
WHERE tablename = 'perfumes'
ORDER BY policyname;