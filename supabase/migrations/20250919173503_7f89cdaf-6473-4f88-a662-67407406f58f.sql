-- Verify all current RLS policies on conversational_sessions
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual 
    ELSE 'No USING clause' 
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check 
    ELSE 'No WITH CHECK clause' 
  END as with_check_clause
FROM pg_policies 
WHERE tablename = 'conversational_sessions'
ORDER BY policyname;