-- Check if conversational_sessions table exists and its RLS status
SELECT 
  t.table_name,
  t.table_schema,
  CASE WHEN c.relrowsecurity THEN 'enabled' ELSE 'disabled' END as rls_status
FROM information_schema.tables t
JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_name = 'conversational_sessions' 
AND t.table_schema = 'public';

-- Check current policies on conversational_sessions
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'conversational_sessions';

-- Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'conversational_sessions'
ORDER BY ordinal_position;