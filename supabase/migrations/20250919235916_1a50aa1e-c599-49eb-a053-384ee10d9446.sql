-- SECURITY FIX: Clean up conflicting RLS policies

-- 1. Remove all conflicting policies first
DROP POLICY IF EXISTS "Public can view perfume catalog for recommendations" ON public.perfumes;
DROP POLICY IF EXISTS "Public can view safe perfume data" ON public.perfumes;
DROP POLICY IF EXISTS "Perfumes are publicly viewable" ON public.perfumes;
DROP POLICY IF EXISTS "Anyone can view perfumes" ON public.perfumes;
DROP POLICY IF EXISTS "Admins only can access sensitive perfume data" ON public.perfumes;

-- 2. Keep only necessary admin policies (clean up duplicates too)
DROP POLICY IF EXISTS "Admins can manage perfumes" ON public.perfumes;
DROP POLICY IF EXISTS "Only admins can view complete perfume data" ON public.perfumes;

-- 3. Create single, secure admin-only policy
CREATE POLICY "Admin access only for sensitive business data"
ON public.perfumes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Verify public view remains accessible (safe data only)
GRANT SELECT ON public.perfumes_public TO anon;
GRANT SELECT ON public.perfumes_public TO authenticated;

-- 5. Final verification
SELECT 'SECURITY STATUS' as check_type,
       COUNT(*) as remaining_policies,
       'Should be 1 admin-only policy' as expected
FROM pg_policies 
WHERE tablename = 'perfumes';

SELECT 'POLICY DETAILS' as info, policyname, cmd as operations
FROM pg_policies 
WHERE tablename = 'perfumes';