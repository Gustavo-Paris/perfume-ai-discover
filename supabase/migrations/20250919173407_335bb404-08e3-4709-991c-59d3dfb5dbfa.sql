-- SECURITY FIX: Add proper RLS policies for conversational_sessions
-- This table was completely locked down with no access policies

-- Policy 1: Users can view their own sessions (authenticated users or guest sessions)
CREATE POLICY "Users can view their own conversational sessions" 
ON public.conversational_sessions 
FOR SELECT 
TO authenticated, anon
USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND session_id = current_setting('app.session_id', true))
);

-- Policy 2: Users can create their own sessions
CREATE POLICY "Users can create their own conversational sessions" 
ON public.conversational_sessions 
FOR INSERT 
TO authenticated, anon
WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND session_id IS NOT NULL)
);

-- Policy 3: Users can update their own sessions
CREATE POLICY "Users can update their own conversational sessions" 
ON public.conversational_sessions 
FOR UPDATE 
TO authenticated, anon
USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND session_id = current_setting('app.session_id', true))
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND session_id IS NOT NULL)
);

-- Policy 4: Only admins can delete conversational sessions (data retention)
CREATE POLICY "Only admins can delete conversational sessions" 
ON public.conversational_sessions 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));