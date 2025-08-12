-- Retry: create missing policies without IF NOT EXISTS

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
