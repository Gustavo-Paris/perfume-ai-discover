-- Harden functions created in the last migration by setting search_path
CREATE OR REPLACE FUNCTION public.update_support_macros_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_support_new_conversation_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  PERFORM public.trigger_email_notification('support_new_conversation', NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_support_new_message_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  PERFORM public.trigger_email_notification('support_new_message', NEW.id);
  RETURN NEW;
END;
$$;