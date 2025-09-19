-- CRITICAL SECURITY FIX: Secure conversational_sessions table
-- This prevents unauthorized access to customer chat history

-- First, enable RLS on conversational_sessions table
ALTER TABLE public.conversational_sessions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own sessions (authenticated users)
CREATE POLICY "Users can view their own conversational sessions" 
ON public.conversational_sessions 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND session_id = current_setting('app.session_id', true))
);

-- Policy 2: Users can create their own sessions
CREATE POLICY "Users can create their own conversational sessions" 
ON public.conversational_sessions 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND session_id IS NOT NULL)
);

-- Policy 3: Users can update their own sessions
CREATE POLICY "Users can update their own conversational sessions" 
ON public.conversational_sessions 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND session_id = current_setting('app.session_id', true))
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND session_id IS NOT NULL)
);

-- Policy 4: Admins can manage all conversational sessions
CREATE POLICY "Admins can manage all conversational sessions" 
ON public.conversational_sessions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy 5: Prevent deletion for non-admins (data retention)
CREATE POLICY "Only admins can delete conversational sessions" 
ON public.conversational_sessions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));