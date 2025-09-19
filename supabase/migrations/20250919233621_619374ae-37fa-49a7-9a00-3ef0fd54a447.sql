-- SECURITY FIX: Protect sensitive business data in perfumes table (Corrected)

-- 1. Enable RLS on perfumes table
ALTER TABLE public.perfumes ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Perfumes are publicly viewable" ON public.perfumes;
DROP POLICY IF EXISTS "Anyone can view perfumes" ON public.perfumes;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.perfumes;

-- 3. Create restrictive policy - only admins can access the main perfumes table
CREATE POLICY "Admins can manage all perfumes data" 
ON public.perfumes 
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Create a secure public view that excludes sensitive business data
DROP VIEW IF EXISTS public.perfumes_public;
CREATE VIEW public.perfumes_public AS
SELECT 
  id,
  name,
  brand,
  description,
  image_url,
  category,
  family,
  gender,
  top_notes,
  heart_notes,
  base_notes,
  created_at,
  -- Include prices but NOT sensitive cost/margin data
  price_2ml,
  price_5ml,
  price_10ml,
  price_full
FROM public.perfumes;

-- 5. Grant access to the public view (views inherit security from underlying tables)
GRANT SELECT ON public.perfumes_public TO anon;
GRANT SELECT ON public.perfumes_public TO authenticated;

-- 6. Ensure perfume_prices table is properly secured
ALTER TABLE public.perfume_prices ENABLE ROW LEVEL SECURITY;

-- Security verification
SELECT 'SECURITY STATUS: perfumes table' as check_type, rowsecurity as rls_enabled
FROM pg_tables WHERE tablename = 'perfumes'
UNION ALL
SELECT 'SECURITY STATUS: perfume_prices table' as check_type, rowsecurity as rls_enabled  
FROM pg_tables WHERE tablename = 'perfume_prices';