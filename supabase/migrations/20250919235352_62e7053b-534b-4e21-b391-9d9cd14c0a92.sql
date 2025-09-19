-- SECURITY AUDIT: Check current protection status of perfumes table

-- 1. Check RLS status
SELECT 
  'TABLE SECURITY STATUS' as check_type,
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS ENABLED' ELSE '❌ RLS DISABLED - VULNERABLE!' END as security_status
FROM pg_tables 
WHERE tablename = 'perfumes';

-- 2. Check existing policies
SELECT 
  'RLS POLICY' as type,
  policyname as policy_name,
  cmd as operations,
  roles as target_roles,
  CASE 
    WHEN qual LIKE '%admin%' THEN '🔒 ADMIN ONLY'
    WHEN qual = 'true' THEN '⚠️ PUBLIC ACCESS'
    ELSE '🔐 RESTRICTED'
  END as access_level
FROM pg_policies 
WHERE tablename = 'perfumes'
ORDER BY policyname;

-- 3. Verify sensitive columns exist
SELECT 
  'SENSITIVE COLUMN CHECK' as type,
  column_name,
  CASE 
    WHEN column_name IN ('avg_cost_per_ml', 'target_margin_percentage') THEN '💰 SENSITIVE BUSINESS DATA'
    WHEN column_name LIKE 'price_%' THEN '💲 PRICING DATA'
    ELSE '📋 BASIC INFO'
  END as data_classification
FROM information_schema.columns 
WHERE table_name = 'perfumes' 
AND column_name IN ('avg_cost_per_ml', 'target_margin_percentage', 'price_2ml', 'price_5ml', 'price_10ml', 'price_full', 'name', 'brand')
ORDER BY data_classification DESC, column_name;

-- 4. Check if public view exists and what it exposes
SELECT 
  'PUBLIC VIEW STATUS' as type,
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.views WHERE table_name = 'perfumes_public') 
    THEN '✅ SECURE VIEW EXISTS' 
    ELSE '❌ NO SECURE VIEW - VULNERABLE!' 
  END as status;