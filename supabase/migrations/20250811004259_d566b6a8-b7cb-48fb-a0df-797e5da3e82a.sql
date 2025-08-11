-- Additional hardening: set fixed search_path on remaining SECURITY DEFINER functions

ALTER FUNCTION public.hard_delete_user_data(uuid) SET search_path = public;
ALTER FUNCTION public.check_advanced_stock_alerts() SET search_path = public;
ALTER FUNCTION public.validate_coupon_advanced(text, numeric, uuid, jsonb) SET search_path = public;
ALTER FUNCTION public.get_perfume_recommendations(uuid, integer, numeric) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;