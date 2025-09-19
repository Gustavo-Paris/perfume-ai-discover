-- SECURITY FIX: Restrict perfumes table access and create public view

-- 1. DROP the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view perfumes" ON public.perfumes;

-- 2. Create a public view with only customer-facing data
CREATE OR REPLACE VIEW public.perfumes_public AS
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

-- 3. Create restricted RLS policy for perfumes table (admin only)
CREATE POLICY "Only admins can view complete perfume data" 
ON public.perfumes 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Enable RLS on the public view (anyone can read public data)
CREATE POLICY "Anyone can view public perfume data" 
ON public.perfumes_public 
FOR SELECT 
USING (true);

-- 5. Grant appropriate permissions
GRANT SELECT ON public.perfumes_public TO anon, authenticated;

-- 6. Create a function to get perfume details for public use
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
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.brand,
    p.name,
    p.description,
    p.family,
    p.gender,
    p.top_notes,
    p.heart_notes,
    p.base_notes,
    p.price_5ml,
    p.price_10ml,
    p.price_full,
    p.price_2ml,
    p.image_url,
    p.category,
    p.created_at,
    p.product_type,
    p.source_size_ml,
    p.available_sizes
  FROM public.perfumes p
  WHERE p.id = perfume_uuid;
$$;