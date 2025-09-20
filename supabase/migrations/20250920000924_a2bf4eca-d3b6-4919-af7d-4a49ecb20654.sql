-- EMERGENCY SECURITY PATCH: Fix customer conversation exposure

-- 1. Identify and remove all existing policies to start clean
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

-- Authenticated users see only their own conversations  
CREATE POLICY "Users view own conversations only"
ON public.conversational_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own conversations
CREATE POLICY "Users create own conversations"
ON public.conversational_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users update own conversations"
ON public.conversational_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Anonymous users ONLY access via session_id (no blanket access)
CREATE POLICY "Anonymous session-based access only"
ON public.conversational_sessions
FOR SELECT
TO anon
USING (user_id IS NULL AND session_id = current_setting('app.session_id', true));

-- Anonymous users can create session conversations
CREATE POLICY "Anonymous create session conversations"
ON public.conversational_sessions
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

-- 4. Verify security is fixed
SET ROLE anon;
SELECT 'FINAL SECURITY TEST' as test,
       COUNT(*) as exposed_records,
       CASE WHEN COUNT(*) = 0 THEN '✅ SECURITY RESTORED' ELSE '❌ STILL EXPOSED' END as result
FROM conversational_sessions;
RESET ROLE;