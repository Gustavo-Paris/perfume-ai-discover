-- CRITICAL SECURITY FIX: Remove Public Access to Manufacturing Recipes
-- 
-- ISSUE: The 'product_recipes' table contains sensitive manufacturing data that
-- competitors could exploit to reverse-engineer products and cost structures
--
-- FIX: Remove public read access, restrict to admin users only

-- Remove the dangerous public read policy that exposes trade secrets
DROP POLICY IF EXISTS "Everyone can view product recipes" ON product_recipes;

-- Recreate admin-only access policy  
DROP POLICY IF EXISTS "Admins can manage product recipes" ON product_recipes;

CREATE POLICY "Admins can manage product recipes" 
ON product_recipes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add security documentation
COMMENT ON TABLE product_recipes IS 'SECURITY: Contains sensitive manufacturing data (trade secrets). Access restricted to admin users only to prevent competitive intelligence theft.';

-- Verify table has RLS enabled
ALTER TABLE product_recipes ENABLE ROW LEVEL SECURITY;