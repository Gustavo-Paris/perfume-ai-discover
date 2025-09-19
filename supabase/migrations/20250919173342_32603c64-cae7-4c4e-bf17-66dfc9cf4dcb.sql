-- Check current RLS policies on conversational_sessions
SELECT 
  policyname,
  cmd,
  roles,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'conversational_sessions';

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'conversational_sessions';