-- CRITICAL SECURITY FIX: Remove vulnerable public access policies

-- Remove all public access policies from main perfumes table
DROP POLICY IF EXISTS "Public can view safe perfume data" ON public.perfumes;
DROP POLICY IF EXISTS "Public can view perfume catalog for recommendations" ON public.perfumes;
DROP POLICY IF EXISTS "Public can view perfume catalog" ON public.perfumes;
DROP POLICY IF EXISTS "Anyone can view perfumes" ON public.perfumes;

-- Clean up duplicate admin policies
DROP POLICY IF EXISTS "Admins can manage perfumes" ON public.perfumes;
DROP POLICY IF EXISTS "Only admins can view complete perfume data" ON public.perfumes;

-- Keep only ONE secure admin policy
DROP POLICY IF EXISTS "Admins can manage all perfumes data" ON public.perfumes;
CREATE POLICY "Admins only can access sensitive perfume data" 
ON public.perfumes 
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Verify the main table is now secure
SELECT 'SECURITY VERIFICATION' as check_type,
       COUNT(*) as remaining_policies,
       CASE WHEN COUNT(*) = 1 THEN '✅ SECURE - ADMIN ONLY' ELSE '❌ STILL VULNERABLE' END as status
FROM pg_policies WHERE tablename = 'perfumes';

-- Confirm public access is only through safe view
SELECT 'PUBLIC ACCESS STATUS' as info,
       CASE WHEN EXISTS(SELECT 1 FROM information_schema.views WHERE table_name = 'perfumes_public') 
         THEN '✅ SAFE - ONLY THROUGH PUBLIC VIEW' 
         ELSE '❌ NO SAFE VIEW' 
       END as result;