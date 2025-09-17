-- CRITICAL SECURITY FIX: Remove Public Access to Manufacturing Recipes
-- 
-- ISSUE: The 'product_recipes' table contains sensitive manufacturing data including:
-- - Material quantities for each product size
-- - Cost structure information  
-- - Manufacturing processes
-- This data could be exploited by competitors to reverse-engineer products
--
-- FIX: Remove public read access, restrict to admin users only

-- Log this security event
INSERT INTO security_audit_log (
  event_type, 
  event_description, 
  resource_type, 
  risk_level,
  metadata
) VALUES (
  'policy_update',
  'Removed public access to manufacturing recipes (product_recipes table)',
  'product_recipes',
  'critical',
  jsonb_build_object(
    'reason', 'prevent_trade_secret_theft',
    'affected_policy', 'Everyone can view product recipes',
    'security_impact', 'critical_business_data_protection'
  )
);

-- Remove the dangerous public read policy
DROP POLICY IF EXISTS "Everyone can view product recipes" ON product_recipes;

-- Ensure only admins can view sensitive manufacturing data
-- (The admin policy already exists, but let's recreate it to be explicit)
DROP POLICY IF EXISTS "Admins can manage product recipes" ON product_recipes;

CREATE POLICY "Admins can manage product recipes" 
ON product_recipes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Verify the fix by adding security documentation
COMMENT ON TABLE product_recipes IS 'SECURITY: Contains sensitive manufacturing data (trade secrets). Access restricted to admin users only to prevent competitive intelligence theft.';

-- Add data classification for compliance tracking
ALTER TABLE product_recipes ADD COLUMN IF NOT EXISTS data_classification TEXT DEFAULT 'trade_secret';
UPDATE product_recipes SET data_classification = 'trade_secret' WHERE data_classification IS NULL OR data_classification = '';

-- Create a security function to monitor recipe access (for admin use)
CREATE OR REPLACE FUNCTION check_recipe_access_permissions()
RETURNS TABLE(
  user_id uuid,
  has_admin_role boolean,
  can_access_recipes boolean
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    auth.uid() as user_id,
    has_role(auth.uid(), 'admin'::app_role) as has_admin_role,
    has_role(auth.uid(), 'admin'::app_role) as can_access_recipes;
$$;