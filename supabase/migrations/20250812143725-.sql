-- Secure conversational_sessions (finalize)

-- Ensure session_id exists and default is set
ALTER TABLE public.conversational_sessions
  ADD COLUMN IF NOT EXISTS session_id text;
ALTER TABLE public.conversational_sessions
  ALTER COLUMN session_id SET DEFAULT current_setting('app.session_id', true);

ALTER TABLE public.conversational_sessions ENABLE ROW LEVEL SECURITY;

-- Drop legacy permissive policies if present
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

-- Admin policy
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

-- User/guest policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='conversational_sessions' 
      AND policyname='Users/guests can create their session rows'
  ) THEN
    CREATE POLICY "Users/guests can create their session rows"
    ON public.conversational_sessions
    FOR INSERT
    WITH CHECK ((auth.uid() = user_id) OR (session_id = current_setting('app.session_id', true)));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='conversational_sessions' 
      AND policyname='Users/guests can view their sessions'
  ) THEN
    CREATE POLICY "Users/guests can view their sessions"
    ON public.conversational_sessions
    FOR SELECT
    USING ((auth.uid() = user_id) OR (session_id = current_setting('app.session_id', true)));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='conversational_sessions' 
      AND policyname='Users/guests can update their sessions'
  ) THEN
    CREATE POLICY "Users/guests can update their sessions"
    ON public.conversational_sessions
    FOR UPDATE
    USING ((auth.uid() = user_id) OR (session_id = current_setting('app.session_id', true)));
  END IF;
END $$;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_conversational_sessions_session_id
  ON public.conversational_sessions(session_id);
