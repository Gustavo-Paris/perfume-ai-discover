-- Fix Security Definer View ownership issue
-- The views are still owned by postgres which triggers the security warning
-- We need to transfer ownership to a less privileged role

-- Transfer ownership of views to authenticator role
ALTER VIEW public.active_promotions OWNER TO authenticator;
ALTER VIEW public.perfumes_with_stock OWNER TO authenticator;

-- Ensure proper permissions are maintained
GRANT SELECT ON public.active_promotions TO anon, authenticated;
GRANT SELECT ON public.perfumes_with_stock TO anon, authenticated;

-- Make sure RLS is properly configured for these views
-- Views should respect the RLS of underlying tables automatically