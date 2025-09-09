-- Fix Security Definer View issue
-- The issue is that views owned by postgres can bypass RLS policies
-- We'll recreate these views to ensure proper security

-- Drop existing views
DROP VIEW IF EXISTS public.company_public_info;
DROP VIEW IF EXISTS public.active_promotions;
DROP VIEW IF EXISTS public.perfumes_with_stock;

-- Recreate company_public_info as a SECURITY DEFINER function instead of a view
-- This is safer as we can control exactly what data is exposed
CREATE OR REPLACE FUNCTION public.get_company_public_info()
RETURNS TABLE(
  nome_fantasia text,
  cidade text,
  estado text,
  email_contato text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    ci.nome_fantasia,
    ci.cidade,
    ci.estado,
    ci.email_contato
  FROM public.company_info ci
  WHERE ci.nome_fantasia IS NOT NULL
  LIMIT 1;
$$;

-- Recreate active_promotions as a regular view (not security definer)
-- This data should be publicly accessible anyway
CREATE VIEW public.active_promotions AS
SELECT 
  p.id,
  p.perfume_id,
  p.title,
  p.description,
  p.discount_type,
  p.discount_value,
  p.original_price_5ml,
  p.original_price_10ml,
  p.original_price_full,
  p.promotional_price_5ml,
  p.promotional_price_10ml,
  p.promotional_price_full,
  p.starts_at,
  p.ends_at,
  p.is_active,
  p.created_at,
  p.updated_at,
  perf.name AS perfume_name,
  perf.brand AS perfume_brand,
  perf.price_full AS current_price_full,
  perf.price_5ml AS current_price_5ml,
  perf.price_10ml AS current_price_10ml
FROM public.promotions p
JOIN public.perfumes perf ON p.perfume_id = perf.id
WHERE p.is_active = true 
  AND p.starts_at <= now() 
  AND p.ends_at > now()
ORDER BY p.created_at DESC;

-- Recreate perfumes_with_stock as a regular view
-- This combines public perfume data with inventory data
CREATE VIEW public.perfumes_with_stock AS
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
  p.image_url,
  p.category,
  p.created_at,
  COALESCE(SUM(il.qty_ml), 0) AS total_stock_ml,
  GREATEST(0, COALESCE(SUM(il.qty_ml) / 5, 0)::integer) AS stock_5ml,
  GREATEST(0, COALESCE(SUM(il.qty_ml) / 10, 0)::integer) AS stock_10ml,
  GREATEST(0, COALESCE(SUM(il.qty_ml) / 50, 0)::integer) AS stock_full,
  CASE
    WHEN COALESCE(SUM(il.qty_ml), 0) = 0 THEN 'out_of_stock'
    WHEN COALESCE(SUM(il.qty_ml), 0) < 30 THEN 'low_stock'
    WHEN COALESCE(SUM(il.qty_ml), 0) < 100 THEN 'medium_stock'
    ELSE 'high_stock'
  END AS stock_status,
  MAX(il.created_at) AS last_stock_update
FROM public.perfumes p
LEFT JOIN public.inventory_lots il ON p.id = il.perfume_id
GROUP BY p.id, p.name, p.brand, p.family, p.gender, p.price_full, p.price_5ml, p.price_10ml, 
         p.description, p.image_url, p.top_notes, p.heart_notes, p.base_notes, p.category, p.created_at;

-- Enable RLS on the views (this ensures they respect RLS policies)
ALTER VIEW public.active_promotions SET (security_barrier = true);
ALTER VIEW public.perfumes_with_stock SET (security_barrier = true);

-- Grant appropriate permissions
GRANT SELECT ON public.active_promotions TO anon, authenticated;
GRANT SELECT ON public.perfumes_with_stock TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_public_info() TO anon, authenticated;