-- Fix conversational_sessions RLS policies to allow anonymous sessions
DROP POLICY IF EXISTS "Users can create conversational sessions" ON conversational_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON conversational_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON conversational_sessions;

-- Allow authenticated users to manage their own sessions
CREATE POLICY "Authenticated users can manage their sessions" ON conversational_sessions
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow anonymous users to create and manage sessions (no user_id)
CREATE POLICY "Anonymous users can create sessions" ON conversational_sessions
FOR ALL
TO anon
USING (user_id IS NULL OR user_id = auth.uid())
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Fix perfumes_public view permissions
-- Grant explicit permissions to the view
GRANT SELECT ON public.perfumes_public TO anon, authenticated;

-- Also check if we need to grant on the underlying table
GRANT SELECT ON public.perfumes TO anon, authenticated;