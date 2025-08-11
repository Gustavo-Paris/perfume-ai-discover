-- Align remaining SECURITY DEFINER functions to fixed search_path=public
ALTER FUNCTION public.update_support_macros_updated_at() SET search_path = public;
ALTER FUNCTION public.send_support_new_conversation_email() SET search_path = public;
ALTER FUNCTION public.send_support_new_message_email() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;