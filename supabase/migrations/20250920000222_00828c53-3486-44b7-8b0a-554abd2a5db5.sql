-- Detailed security verification for conversational_sessions

-- 1. Count total RLS policies
SELECT 'TOTAL RLS POLICIES' as metric, COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'conversational_sessions';

-- 2. List all policies with details
SELECT 
  policyname as policy_name,
  cmd as operation,
  LEFT(qual, 80) as access_condition
FROM pg_policies 
WHERE tablename = 'conversational_sessions'
ORDER BY cmd, policyname;

-- 3. Verify table structure for sensitive data
SELECT 'TABLE COLUMNS' as info, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'conversational_sessions'
ORDER BY ordinal_position;

-- 4. Final security status summary
SELECT 
  'SECURITY STATUS SUMMARY' as summary,
  CASE WHEN rowsecurity THEN 'RLS ENABLED ✅' ELSE 'RLS DISABLED ❌' END as rls_status,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'conversational_sessions') as policy_count
FROM pg_tables 
WHERE tablename = 'conversational_sessions';