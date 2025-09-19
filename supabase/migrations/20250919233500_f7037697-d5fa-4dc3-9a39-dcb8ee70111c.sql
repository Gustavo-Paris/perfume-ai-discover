-- Check current security status of perfumes table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as security_status
FROM pg_tables 
WHERE tablename = 'perfumes';

-- Check current policies on perfumes table
SELECT 
  '🔐 RLS POLICY: ' || policyname as policy_info,
  cmd as operation,
  roles as allowed_roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || LEFT(qual, 100) || '...'
    ELSE 'No restrictions'
  END as access_condition
FROM pg_policies 
WHERE tablename = 'perfumes'
ORDER BY cmd, policyname;

-- Check what columns exist in perfumes table to understand the sensitive data
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'perfumes' 
AND column_name IN ('avg_cost_per_ml', 'target_margin_percentage', 'price_2ml', 'price_5ml', 'price_10ml', 'price_full')
ORDER BY column_name;