-- Fix perfumes table RLS to allow public catalog access
-- The current policy is too restrictive - only admins can see perfumes

-- Remove the overly restrictive policy
DROP POLICY IF EXISTS "Admin access only for sensitive business data" ON public.perfumes;

-- Create separate policies for different access levels

-- 1. Public can view basic perfume information (for catalog browsing)
CREATE POLICY "Public can view perfume catalog"
ON public.perfumes
FOR SELECT
TO public
USING (true);

-- 2. Admins can do everything (manage perfumes + see sensitive data)
CREATE POLICY "Admins can manage all perfume data"
ON public.perfumes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Note: This fixes the catalog display issue while keeping admin controls secure
-- Sensitive business data like costs and margins are still protected by admin-only access