-- Detailed security verification for perfumes table

-- Check what columns are exposed in public view vs main table
SELECT 'COLUMNS IN PUBLIC VIEW (competitors see this)' as info, column_name
FROM information_schema.columns 
WHERE table_name = 'perfumes_public'
ORDER BY column_name;

-- Check what sensitive columns exist in main table
SELECT 'SENSITIVE COLUMNS IN MAIN TABLE (protected)' as info, column_name
FROM information_schema.columns 
WHERE table_name = 'perfumes' 
AND column_name IN ('avg_cost_per_ml', 'target_margin_percentage')
ORDER BY column_name;

-- Test access as anonymous user would see
SET ROLE anon;
SELECT 'ANONYMOUS ACCESS TEST' as test_type, 
       COUNT(*) as can_see_records,
       CASE WHEN COUNT(*) > 0 THEN 'Can see data' ELSE 'Blocked by RLS' END as access_result
FROM perfumes_public 
LIMIT 1;

-- Reset role
RESET ROLE;