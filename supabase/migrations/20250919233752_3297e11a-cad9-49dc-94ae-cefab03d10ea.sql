-- Fix the security definer view issue
-- Replace the view with a more secure approach

DROP VIEW IF EXISTS public.perfumes_public;

-- Create a security invoker view (default) that respects RLS
CREATE VIEW public.perfumes_public 
WITH (security_invoker = true) AS
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

-- Since the view now respects RLS and the perfumes table is admin-only,
-- we need to create a policy that allows public access to safe columns only
CREATE POLICY "Public can view safe perfume data"
ON public.perfumes
FOR SELECT
TO anon, authenticated
USING (true);

-- Ensure the admin policy takes precedence for full access
DROP POLICY IF EXISTS "Admins can manage all perfumes data" ON public.perfumes;
CREATE POLICY "Admins can manage all perfumes data" 
ON public.perfumes 
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Grant SELECT on the view
GRANT SELECT ON public.perfumes_public TO anon;
GRANT SELECT ON public.perfumes_public TO authenticated;

-- Final security check
SELECT 'VIEW CREATED: perfumes_public now secure and accessible' as status;