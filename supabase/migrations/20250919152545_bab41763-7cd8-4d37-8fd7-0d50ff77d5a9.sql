-- Fix Security Definer View warning by removing SECURITY DEFINER from function
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