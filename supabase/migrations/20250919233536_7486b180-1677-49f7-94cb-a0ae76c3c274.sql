-- SECURITY FIX: Protect sensitive business data in perfumes table

-- 1. Enable RLS on perfumes table (if not already enabled)
ALTER TABLE public.perfumes ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing overly permissive policies that might exist
DROP POLICY IF EXISTS "Perfumes are publicly viewable" ON public.perfumes;
DROP POLICY IF EXISTS "Anyone can view perfumes" ON public.perfumes;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.perfumes;

-- 3. Create restrictive policies for the main perfumes table
-- Only admins can see the full table with sensitive data
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
  -- Include prices but NOT cost/margin data
  price_2ml,
  price_5ml,
  price_10ml,
  price_full
FROM public.perfumes;

-- 5. Enable RLS on the public view and allow public access
ALTER VIEW public.perfumes_public SET (security_barrier = true);

-- Create policy to allow public read access to the safe view
CREATE POLICY "Public view is accessible to everyone"
ON public.perfumes_public
FOR SELECT
TO anon, authenticated
USING (true);

-- 6. Ensure perfume_prices table (if used) is also properly secured
ALTER TABLE public.perfume_prices ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive policies on perfume_prices if they exist
DROP POLICY IF EXISTS "Anyone can view perfume prices" ON public.perfume_prices;

-- Create secure policy for perfume_prices (prices are OK to be public, but not cost data)
CREATE POLICY "Public can view perfume prices only"
ON public.perfume_prices
FOR SELECT
TO anon, authenticated
USING (true);

-- Admins can manage perfume prices
CREATE POLICY "Admins can manage perfume prices"
ON public.perfume_prices
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 7. Security verification - check that sensitive data is protected
SELECT 'SECURITY CHECK: Verifying RLS is enabled on perfumes table' as status;
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'perfumes';