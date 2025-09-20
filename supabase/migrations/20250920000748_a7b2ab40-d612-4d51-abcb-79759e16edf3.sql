-- Check existing security and fill gaps

-- First, let's see what policies already exist
SELECT 'EXISTING POLICY' as status, policyname as policy_name, cmd as operation,
       LEFT(COALESCE(qual, 'No condition'), 80) as condition
FROM pg_policies 
WHERE tablename = 'conversational_sessions'
ORDER BY policyname;

-- Check RLS status
SELECT 'RLS STATUS' as check_type,
       CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE tablename = 'conversational_sessions';

-- Test security as anonymous user
SET ROLE anon;
SELECT 'ANONYMOUS ACCESS TEST' as test,
       COUNT(*) as records_accessible,
       CASE WHEN COUNT(*) = 0 THEN '✅ BLOCKED - SECURE' ELSE '❌ EXPOSED - VULNERABLE' END as security_result
FROM conversational_sessions;
RESET ROLE;