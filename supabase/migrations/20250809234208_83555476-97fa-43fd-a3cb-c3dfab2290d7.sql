-- Create support_macros table for quick replies (macros)
CREATE TABLE IF NOT EXISTS public.support_macros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.support_macros ENABLE ROW LEVEL SECURITY;

-- RLS: Admins can manage all macros
CREATE POLICY IF NOT EXISTS "Admins can manage support macros"
ON public.support_macros
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger function for support_macros
CREATE OR REPLACE FUNCTION public.update_support_macros_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach updated_at trigger
DROP TRIGGER IF EXISTS update_support_macros_updated_at ON public.support_macros;
CREATE TRIGGER update_support_macros_updated_at
BEFORE UPDATE ON public.support_macros
FOR EACH ROW
EXECUTE FUNCTION public.update_support_macros_updated_at();

-- Trigger helpers to send email notifications for support events
CREATE OR REPLACE FUNCTION public.send_support_new_conversation_email()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.trigger_email_notification('support_new_conversation', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.send_support_new_message_email()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.trigger_email_notification('support_new_message', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to support tables
DROP TRIGGER IF EXISTS send_support_new_conversation ON public.support_conversations;
CREATE TRIGGER send_support_new_conversation
AFTER INSERT ON public.support_conversations
FOR EACH ROW
EXECUTE FUNCTION public.send_support_new_conversation_email();

DROP TRIGGER IF EXISTS send_support_new_message ON public.support_messages;
CREATE TRIGGER send_support_new_message
AFTER INSERT ON public.support_messages
FOR EACH ROW
EXECUTE FUNCTION public.send_support_new_message_email();