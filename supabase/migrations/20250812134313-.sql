-- Secure conversational_sessions so only owners (user or browser session) and admins can access

-- 1) Add session_id to bind guest sessions to browser session
ALTER TABLE public.conversational_sessions
  ADD COLUMN IF NOT EXISTS session_id text;

-- Default to PostgREST session id for new rows
ALTER TABLE public.conversational_sessions
  ALTER COLUMN session_id SET DEFAULT current_setting('app.session_id', true);

-- Optional: ensure RLS is enabled
ALTER TABLE public.conversational_sessions ENABLE ROW LEVEL SECURITY;

-- 2) Replace permissive/public policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='conversational_sessions' 
      AND policyname='Users can create conversational sessions'
  ) THEN
    DROP POLICY "Users can create conversational sessions" ON public.conversational_sessions;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='conversational_sessions' 
      AND policyname='Users can update their own conversational sessions'
  ) THEN
    DROP POLICY "Users can update their own conversational sessions" ON public.conversational_sessions;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='conversational_sessions' 
      AND policyname='Users can view their own conversational sessions'
  ) THEN
    DROP POLICY "Users can view their own conversational sessions" ON public.conversational_sessions;
  END IF;
END $$;

-- 3) Hardened policies
-- Admins: full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='conversational_sessions' 
      AND policyname='Admins can manage all conversational sessions'
  ) THEN
    CREATE POLICY "Admins can manage all conversational sessions"
    ON public.conversational_sessions
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Users/guests: create (insert) rows for self or current browser session
CREATE POLICY IF NOT EXISTS "Users/guests can create their session rows"
ON public.conversational_sessions
FOR INSERT
WITH CHECK ((auth.uid() = user_id) OR (session_id = current_setting('app.session_id', true)));

-- Users/guests: view only their own rows (by user_id or session_id)
CREATE POLICY IF NOT EXISTS "Users/guests can view their sessions"
ON public.conversational_sessions
FOR SELECT
USING ((auth.uid() = user_id) OR (session_id = current_setting('app.session_id', true)));

-- Users/guests: update only their own rows
CREATE POLICY IF NOT EXISTS "Users/guests can update their sessions"
ON public.conversational_sessions
FOR UPDATE
USING ((auth.uid() = user_id) OR (session_id = current_setting('app.session_id', true)));

-- 4) Helpful index for session-based lookups
CREATE INDEX IF NOT EXISTS idx_conversational_sessions_session_id
  ON public.conversational_sessions(session_id);
