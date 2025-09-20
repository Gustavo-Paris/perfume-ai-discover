-- CRITICAL SECURITY FIX: Protect conversational_sessions table

-- 1. Enable RLS on conversational_sessions table
ALTER TABLE public.conversational_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Drop any overly permissive policies if they exist
DROP POLICY IF EXISTS "Everyone can view conversations" ON public.conversational_sessions;
DROP POLICY IF EXISTS "Public can access conversations" ON public.conversational_sessions;
DROP POLICY IF EXISTS "Allow public read" ON public.conversational_sessions;

-- 3. Create secure RLS policies for customer data protection

-- Admin access for support and monitoring
CREATE POLICY "Admins can manage all conversational sessions"
ON public.conversational_sessions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can only see their own conversations
CREATE POLICY "Users can view their own conversations"
ON public.conversational_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own conversations
CREATE POLICY "Users can create their own conversations"
ON public.conversational_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update their own conversations"
ON public.conversational_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Guest users (anonymous) can access by session_id only
CREATE POLICY "Guest users can access by session ID"
ON public.conversational_sessions
FOR SELECT
TO anon
USING (session_id = current_setting('app.session_id', true));

-- Guest users can create conversations with session_id
CREATE POLICY "Guest users can create conversations"
ON public.conversational_sessions
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

-- Guest users can update their session conversations
CREATE POLICY "Guest users can update their conversations"
ON public.conversational_sessions
FOR UPDATE
TO anon
USING (user_id IS NULL AND session_id = current_setting('app.session_id', true))
WITH CHECK (user_id IS NULL AND session_id = current_setting('app.session_id', true));

-- Data retention policy (delete old guest conversations)
CREATE POLICY "Auto-delete old guest conversations"
ON public.conversational_sessions
FOR DELETE
TO service_role
USING (user_id IS NULL AND created_at < now() - interval '30 days');

-- 4. Security verification
SELECT 'SECURITY IMPLEMENTATION COMPLETE' as status,
       'Customer conversations now protected' as result;

-- Show final policies
SELECT 'RLS POLICY' as type, policyname as policy, cmd as operation
FROM pg_policies 
WHERE tablename = 'conversational_sessions'
ORDER BY policyname;