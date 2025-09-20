-- SECURITY AUDIT: Check conversational_sessions table protection

-- 1. Check RLS status
SELECT 
  'CONVERSATIONAL_SESSIONS SECURITY' as check_type,
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS ENABLED' ELSE '❌ RLS DISABLED - VULNERABLE!' END as security_status
FROM pg_tables 
WHERE tablename = 'conversational_sessions';

-- 2. Check existing RLS policies
SELECT 
  'RLS POLICY' as type,
  policyname as policy_name,
  cmd as operations,
  roles as target_roles,
  CASE 
    WHEN qual LIKE '%admin%' THEN '🔒 ADMIN ACCESS'
    WHEN qual LIKE '%auth.uid()%' THEN '🔐 USER OWNS DATA'
    WHEN qual LIKE '%session_id%' THEN '🔑 SESSION BASED'
    WHEN qual = 'true' THEN '⚠️ PUBLIC ACCESS - VULNERABLE!'
    ELSE '🔐 RESTRICTED'
  END as access_level
FROM pg_policies 
WHERE tablename = 'conversational_sessions'
ORDER BY policyname;

-- 3. Test anonymous access (should be blocked)
SET ROLE anon;
SELECT 'ANONYMOUS ACCESS TEST' as test,
       COUNT(*) as records_visible,
       CASE WHEN COUNT(*) > 0 THEN '❌ VULNERABLE - DATA EXPOSED' ELSE '✅ SECURE - ACCESS BLOCKED' END as security_result
FROM conversational_sessions;
RESET ROLE;

-- 4. Check what sensitive data exists in the table
SELECT 'SENSITIVE DATA CHECK' as info, column_name
FROM information_schema.columns 
WHERE table_name = 'conversational_sessions'
AND column_name IN ('user_id', 'session_id', 'conversation_data', 'user_preferences', 'ai_recommendations')
ORDER BY column_name;