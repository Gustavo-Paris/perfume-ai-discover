-- SECURITY FIX: Restrict perfumes table access and create public view

-- 1. DROP the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view perfumes" ON public.perfumes;

-- 2. Create a public view with only customer-facing data (NO sensitive business data)
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

-- 3. Create restricted RLS policy for perfumes table (admin only for sensitive data)
CREATE POLICY "Only admins can view complete perfume data" 
ON public.perfumes 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Grant permissions on the public view (views don't use RLS)
GRANT SELECT ON public.perfumes_public TO anon, authenticated;

-- 5. Create security definer function for public perfume access
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