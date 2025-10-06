-- Enable RLS on perfumes table to protect sensitive cost data
ALTER TABLE public.perfumes ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view perfumes (basic data only)
-- Note: This allows SELECT but sensitive fields like avg_cost_per_ml 
-- should be filtered at application level or use views
CREATE POLICY "Anyone can view perfumes basic data"
ON public.perfumes
FOR SELECT
USING (true);

-- Policy: Only admins can insert perfumes
CREATE POLICY "Admins can insert perfumes"
ON public.perfumes
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Only admins can update perfumes
CREATE POLICY "Admins can update perfumes"
ON public.perfumes
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Only admins can delete perfumes
CREATE POLICY "Admins can delete perfumes"
ON public.perfumes
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a secure view for public perfume data (without costs)
CREATE OR REPLACE VIEW public.perfumes_public AS
SELECT 
  id,
  name,
  brand,
  description,
  image_url,
  gender,
  family,
  top_notes,
  heart_notes,
  base_notes,
  category,
  price_2ml,
  price_5ml,
  price_10ml,
  price_full,
  created_at
FROM public.perfumes;

-- Grant access to the public view
GRANT SELECT ON public.perfumes_public TO authenticated, anon;

-- Create a secure function to get perfume with costs (admin only)
CREATE OR REPLACE FUNCTION public.get_perfume_with_costs(perfume_uuid uuid)
RETURNS TABLE(
  id uuid,
  name text,
  brand text,
  description text,
  image_url text,
  gender text,
  family text,
  top_notes text[],
  heart_notes text[],
  base_notes text[],
  category text,
  price_2ml numeric,
  price_5ml numeric,
  price_10ml numeric,
  price_full numeric,
  avg_cost_per_ml numeric,
  target_margin_percentage numeric,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.name,
    p.brand,
    p.description,
    p.image_url,
    p.gender,
    p.family,
    p.top_notes,
    p.heart_notes,
    p.base_notes,
    p.category,
    p.price_2ml,
    p.price_5ml,
    p.price_10ml,
    p.price_full,
    p.avg_cost_per_ml,
    p.target_margin_percentage,
    p.created_at
  FROM public.perfumes p
  WHERE p.id = perfume_uuid
    AND has_role(auth.uid(), 'admin'::app_role);
$$;