-- EMERGENCY SECURITY PATCH: Block unauthorized access to customer conversations

-- 1. First, let's see all current policies to identify the problem
SELECT policyname, cmd, 
       CASE WHEN qual IS NULL OR qual = '' THEN 'NO RESTRICTIONS - VULNERABLE!' 
            ELSE LEFT(qual, 100) END as access_condition
FROM pg_policies 
WHERE tablename = 'conversational_sessions';

-- 2. Drop any policies that allow unrestricted access
DROP POLICY IF EXISTS "Enable read access for all users" ON public.conversational_sessions;
DROP POLICY IF EXISTS "Public conversations access" ON public.conversational_sessions;
DROP POLICY IF EXISTS "Allow anonymous access" ON public.conversational_sessions;

-- 3. Ensure RLS is enabled
ALTER TABLE public.conversational_sessions ENABLE ROW LEVEL SECURITY;

-- 4. Create minimal secure policies (avoid conflicts with existing ones)
-- Try to create missing security policies with unique names
CREATE POLICY IF NOT EXISTS "Secure user conversations access"
ON public.conversational_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Secure session conversations access"
ON public.conversational_sessions
FOR SELECT
TO anon
USING (session_id = current_setting('app.session_id', true) AND session_id IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Secure user conversation creation"
ON public.conversational_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Secure session conversation creation"
ON public.conversational_sessions
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

-- 5. Test security fix
SET ROLE anon;
SELECT 'SECURITY VERIFICATION' as test,
       COUNT(*) as records_now_accessible,
       CASE WHEN COUNT(*) = 0 THEN '✅ BREACH FIXED' ELSE '❌ STILL VULNERABLE' END as status
FROM conversational_sessions;
RESET ROLE;