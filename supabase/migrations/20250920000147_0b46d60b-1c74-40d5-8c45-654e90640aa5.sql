-- Detailed conversational_sessions security check

-- Check all current RLS policies in detail
SELECT 
  policyname as policy_name,
  cmd as operation,
  LEFT(COALESCE(qual, 'No restrictions'), 100) as access_condition,
  LEFT(COALESCE(with_check, 'No check'), 100) as insert_condition
FROM pg_policies 
WHERE tablename = 'conversational_sessions'
ORDER BY policyname;

-- Check RLS status
SELECT 
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN 'PROTECTED' ELSE 'VULNERABLE' END as status
FROM pg_tables 
WHERE tablename = 'conversational_sessions';

-- Test what data structure exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'conversational_sessions'
ORDER BY ordinal_position;