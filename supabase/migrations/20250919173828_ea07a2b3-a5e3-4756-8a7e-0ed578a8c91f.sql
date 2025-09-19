-- Verify current security status of conversational_sessions table
-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as security_status
FROM pg_tables 
WHERE tablename = 'conversational_sessions';

-- Check all current policies
SELECT 
  '🔐 RLS POLICY: ' || policyname as policy_info,
  cmd as operation,
  roles as allowed_roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || LEFT(qual, 100) || '...'
    ELSE 'No restrictions'
  END as access_condition
FROM pg_policies 
WHERE tablename = 'conversational_sessions'
ORDER BY cmd, policyname;