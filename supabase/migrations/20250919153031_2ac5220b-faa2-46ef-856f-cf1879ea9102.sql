-- Fix Security Definer View warning
-- The issue is that the perfumes_public view runs with elevated privileges

-- Drop and recreate the view without security definer implications
DROP VIEW IF EXISTS public.perfumes_public;

-- Create the view with proper security context
CREATE VIEW public.perfumes_public AS
SELECT 
  id,
  brand,
  name,
  description,
  family,
  gender,
  top_notes,
  heart_notes,
  base_notes,
  price_5ml,
  price_10ml,
  price_full,
  price_2ml,
  image_url,
  category,
  created_at,
  product_type,
  source_size_ml,
  available_sizes
FROM public.perfumes;

-- Grant explicit permissions (this is safe since it's only public data)
GRANT SELECT ON public.perfumes_public TO anon, authenticated;

-- Ensure the view uses the caller's permissions, not the creator's
ALTER VIEW public.perfumes_public OWNER TO authenticator;