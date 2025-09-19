-- Check current security status (fixed query)
SELECT 
  '🔐 RLS ENABLED ON PERFUMES' as status,
  CASE WHEN rowsecurity THEN 'YES - SECURED' ELSE 'NO - VULNERABLE' END as result
FROM pg_tables WHERE tablename = 'perfumes';

-- Check RLS policies
SELECT 
  '📋 RLS POLICIES' as info,
  policyname as policy_name,
  cmd as operation
FROM pg_policies WHERE tablename = 'perfumes'
ORDER BY cmd, policyname;

-- Check public view exists and columns
SELECT 
  'PUBLIC VIEW STATUS' as info,
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.views WHERE table_name = 'perfumes_public') 
    THEN '✅ EXISTS - SAFE FOR PUBLIC' 
    ELSE '❌ MISSING - VULNERABLE' 
  END as result;