-- EMERGENCY SECURITY FIX: Clean slate approach to secure conversations

-- 1. Check what policies currently exist and drop ALL of them
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'conversational_sessions'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.conversational_sessions';
    END LOOP;
END $$;

-- 2. Ensure RLS is enabled
ALTER TABLE public.conversational_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Create comprehensive secure policies from scratch

-- Admin access for support
CREATE POLICY "Admin full access to conversations"
ON public.conversational_sessions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can only access their own conversations
CREATE POLICY "Users access own conversations"
ON public.conversational_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users create own conversations"
ON public.conversational_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own conversations"
ON public.conversational_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Guest users access only by valid session ID
CREATE POLICY "Guest session access"
ON public.conversational_sessions
FOR SELECT
TO anon
USING (session_id = current_setting('app.session_id', true) AND user_id IS NULL);

CREATE POLICY "Guest session creation"
ON public.conversational_sessions
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

CREATE POLICY "Guest session updates"
ON public.conversational_sessions
FOR UPDATE
TO anon
USING (user_id IS NULL AND session_id = current_setting('app.session_id', true))
WITH CHECK (user_id IS NULL AND session_id = current_setting('app.session_id', true));

-- 4. Final security test
SET ROLE anon;
SELECT 'FINAL SECURITY CHECK' as test,
       COUNT(*) as exposed_records,
       CASE WHEN COUNT(*) = 0 THEN '🔒 SECURE - NO DATA EXPOSED' ELSE '⚠️ VULNERABLE - ' || COUNT(*) || ' RECORDS EXPOSED' END as result
FROM conversational_sessions;
RESET ROLE;