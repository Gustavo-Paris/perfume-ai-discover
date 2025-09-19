-- Fix Security Definer View issue
-- The problem is that PostgreSQL views default to SECURITY DEFINER behavior
-- We need to explicitly make our view use SECURITY INVOKER instead

-- Drop and recreate the view with SECURITY INVOKER
DROP VIEW IF EXISTS public.perfumes_public CASCADE;

-- Create the view with explicit SECURITY INVOKER (uses caller's permissions)
CREATE VIEW public.perfumes_public 
WITH (security_invoker = true) AS
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

-- Grant explicit permissions
GRANT SELECT ON public.perfumes_public TO anon, authenticated;

-- Update the function to also be SECURITY INVOKER if needed
CREATE OR REPLACE FUNCTION public.get_perfume_public_details(perfume_uuid uuid)
RETURNS TABLE(
  id uuid,
  brand text,
  name text,
  description text,
  family text,
  gender text,
  top_notes text[],
  heart_notes text[],
  base_notes text[],
  price_5ml numeric,
  price_10ml numeric,
  price_full numeric,
  price_2ml numeric,
  image_url text,
  category text,
  created_at timestamp with time zone,
  product_type text,
  source_size_ml integer,
  available_sizes jsonb
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
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
  FROM public.perfumes_public
  WHERE id = perfume_uuid;
$$;