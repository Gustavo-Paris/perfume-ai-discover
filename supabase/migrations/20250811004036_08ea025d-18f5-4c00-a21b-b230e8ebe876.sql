-- Harden SECURITY DEFINER functions by setting a fixed search_path
-- This mitigates search_path hijacking per Supabase linter warning 0011

-- Points and loyalty
ALTER FUNCTION public.get_user_points_balance(uuid) SET search_path = public;
ALTER FUNCTION public.add_points_transaction(uuid, integer, text, text, uuid) SET search_path = public;

-- Orders and purchases
ALTER FUNCTION public.user_has_purchased_perfume(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.validate_coupon(text, numeric, uuid) SET search_path = public;
ALTER FUNCTION public.apply_coupon_to_order(text, uuid) SET search_path = public;

-- Reservations and stock
ALTER FUNCTION public.get_available_stock(uuid, integer) SET search_path = public;
ALTER FUNCTION public.upsert_reservation(uuid, integer, integer, uuid, integer) SET search_path = public;
ALTER FUNCTION public.cleanup_expired_reservations() SET search_path = public;
ALTER FUNCTION public.check_low_stock_alerts() SET search_path = public;
ALTER FUNCTION public.update_sales_statistics() SET search_path = public;

-- Promotions
ALTER FUNCTION public.get_active_promotion(uuid) SET search_path = public;
ALTER FUNCTION public.get_active_promotion_optimized(uuid) SET search_path = public;

-- Access logs
ALTER FUNCTION public.log_user_access(uuid, text, inet, text) SET search_path = public;
ALTER FUNCTION public.cleanup_old_access_logs() SET search_path = public;

-- Emails / notifications
ALTER FUNCTION public.trigger_email_notification(text, uuid) SET search_path = public;

-- Search & analytics helpers
ALTER FUNCTION public.increment_search_count(text) SET search_path = public;
ALTER FUNCTION public.detect_abandoned_carts() SET search_path = public;
ALTER FUNCTION public.create_cart_recovery_attempt(uuid, text, text, text, numeric, text) SET search_path = public;
ALTER FUNCTION public.mark_cart_as_abandoned() SET search_path = public;

-- Recommendations and interactions
ALTER FUNCTION public.log_perfume_interaction(uuid, text, text, integer, jsonb) SET search_path = public;
ALTER FUNCTION public.get_user_recommendations(uuid, integer) SET search_path = public;