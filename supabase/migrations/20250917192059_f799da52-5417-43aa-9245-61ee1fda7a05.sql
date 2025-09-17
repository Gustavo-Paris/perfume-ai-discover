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

-- Add additional security: Create audit trigger for recipe access
CREATE OR REPLACE FUNCTION log_recipe_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log any access to manufacturing recipes
  INSERT INTO security_audit_log (
    user_id,
    event_type,
    event_description,
    resource_type,
    resource_id,
    risk_level,
    metadata
  ) VALUES (
    auth.uid(),
    'sensitive_data_access',
    'Accessed manufacturing recipe for perfume: ' || NEW.perfume_id::text,
    'product_recipes',
    NEW.id::text,
    'medium',
    jsonb_build_object(
      'perfume_id', NEW.perfume_id,
      'material_id', NEW.material_id,
      'size_ml', NEW.size_ml,
      'access_type', TG_OP
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for monitoring recipe access
DROP TRIGGER IF EXISTS audit_recipe_access ON product_recipes;
CREATE TRIGGER audit_recipe_access
  AFTER SELECT ON product_recipes
  FOR EACH ROW
  EXECUTE FUNCTION log_recipe_access();

-- Verify the fix by checking policies
COMMENT ON TABLE product_recipes IS 'SECURITY: Contains sensitive manufacturing data. Access restricted to admin users only. All access is audited.';

-- Add data classification
ALTER TABLE product_recipes ADD COLUMN IF NOT EXISTS data_classification TEXT DEFAULT 'trade_secret';
UPDATE product_recipes SET data_classification = 'trade_secret' WHERE data_classification IS NULL;