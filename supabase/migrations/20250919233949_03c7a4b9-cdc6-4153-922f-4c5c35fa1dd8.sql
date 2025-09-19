-- Check current security status after the fix
SELECT 
  '🔐 PERFUMES TABLE RLS STATUS' as check_type,
  rowsecurity as rls_enabled
FROM pg_tables WHERE tablename = 'perfumes'
UNION ALL
SELECT 
  '📋 CURRENT RLS POLICIES' as check_type,
  COUNT(*)::text as policy_count
FROM pg_policies WHERE tablename = 'perfumes'
UNION ALL
SELECT 
  '👀 PUBLIC VIEW EXISTS' as check_type,
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.views WHERE table_name = 'perfumes_public') 
    THEN 'YES' ELSE 'NO' END as view_exists;

-- Show what columns are available in the public view vs main table
SELECT 'PUBLIC VIEW COLUMNS (safe for competitors)' as info, column_name
FROM information_schema.columns 
WHERE table_name = 'perfumes_public'
ORDER BY column_name;