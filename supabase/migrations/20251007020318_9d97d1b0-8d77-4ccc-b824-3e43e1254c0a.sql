-- ============================================
-- FASE 1: Corrigir Security Definer Views
-- ============================================

-- Fix fiscal_notes_view - forçar security_invoker
DROP VIEW IF EXISTS public.fiscal_notes_view CASCADE;

CREATE VIEW public.fiscal_notes_view 
WITH (security_invoker = true)
AS
SELECT 
  fn.id,
  fn.order_id,
  fn.numero,
  fn.serie,
  fn.chave_acesso,
  fn.status,
  fn.protocolo_autorizacao,
  fn.data_emissao,
  fn.data_autorizacao,
  fn.valor_total,
  fn.valor_produtos,
  fn.valor_icms,
  fn.valor_pis,
  fn.valor_cofins,
  fn.valor_ipi,
  fn.xml_content,
  fn.pdf_url,
  fn.focus_nfe_ref,
  fn.erro_message,
  fn.created_at,
  fn.updated_at,
  o.order_number,
  o.user_id,
  o.total_amount AS order_total,
  o.created_at AS order_created_at,
  COUNT(fni.id) AS items_count
FROM fiscal_notes fn
JOIN orders o ON fn.order_id = o.id
LEFT JOIN fiscal_note_items fni ON fn.id = fni.fiscal_note_id
GROUP BY fn.id, o.order_number, o.user_id, o.total_amount, o.created_at;

ALTER VIEW public.fiscal_notes_view OWNER TO postgres;

-- ============================================
-- FASE 2: Limpar Políticas RLS Duplicadas (profiles)
-- ============================================

-- Remover políticas antigas duplicadas (mantendo as mais específicas)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Resultado: Manter apenas 4 políticas limpas:
-- 1. "Users can only view their own profile" (SELECT)
-- 2. "Users can only insert their own profile" (INSERT)
-- 3. "Users can only update their own profile" (UPDATE)
-- 4. "Admins can view all profiles" (ALL para admins)

-- ============================================
-- FASE 3: Corrigir Search Path de Funções SECURITY DEFINER
-- ============================================

-- Corrigir funções críticas sem search_path fixo
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.get_user_points_balance(uuid) SET search_path = public;
ALTER FUNCTION public.validate_coupon(text, numeric, uuid) SET search_path = public;
ALTER FUNCTION public.apply_coupon_to_order(text, uuid) SET search_path = public;
ALTER FUNCTION public.add_points_transaction(uuid, integer, text, text, uuid) SET search_path = public;
ALTER FUNCTION public.get_available_stock(uuid, integer) SET search_path = public;
ALTER FUNCTION public.check_perfume_availability(uuid, integer, integer, uuid) SET search_path = public;
ALTER FUNCTION public.upsert_reservation(uuid, integer, integer, uuid, integer) SET search_path = public;
ALTER FUNCTION public.cleanup_expired_reservations() SET search_path = public;
ALTER FUNCTION public.log_user_access(uuid, text, inet, text) SET search_path = public;
ALTER FUNCTION public.log_compliance_event(uuid, text, text, text, jsonb, text, inet, text, text) SET search_path = public;
ALTER FUNCTION public.log_security_event(uuid, text, text, inet, text, text, jsonb) SET search_path = public;
ALTER FUNCTION public.check_rate_limit(uuid, inet, text, integer, integer) SET search_path = public;
ALTER FUNCTION public.increment_search_count(text) SET search_path = public;
ALTER FUNCTION public.get_perfume_recommendations(uuid, integer, numeric) SET search_path = public;
ALTER FUNCTION public.get_user_recommendations(uuid, integer) SET search_path = public;
ALTER FUNCTION public.calculate_notes_similarity(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.user_has_purchased_perfume(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.get_active_promotion(uuid) SET search_path = public;
ALTER FUNCTION public.get_active_promotion_optimized(uuid) SET search_path = public;
ALTER FUNCTION public.get_perfume_dynamic_prices(uuid) SET search_path = public;
ALTER FUNCTION public.set_perfume_price(uuid, integer, numeric) SET search_path = public;
ALTER FUNCTION public.update_perfume_avg_cost(uuid) SET search_path = public;
ALTER FUNCTION public.get_perfumes_secure(integer, integer) SET search_path = public;
ALTER FUNCTION public.hard_delete_user_data(uuid) SET search_path = public;
ALTER FUNCTION public.check_low_stock_alerts() SET search_path = public;
ALTER FUNCTION public.update_sales_statistics() SET search_path = public;
ALTER FUNCTION public.cleanup_old_access_logs() SET search_path = public;
ALTER FUNCTION public.detect_abandoned_carts() SET search_path = public;
ALTER FUNCTION public.mark_cart_as_abandoned() SET search_path = public;
ALTER FUNCTION public.create_cart_recovery_attempt(uuid, text, text, text, numeric, text) SET search_path = public;
ALTER FUNCTION public.log_perfume_interaction(uuid, text, text, integer, jsonb) SET search_path = public;
ALTER FUNCTION public.calculate_packaging_costs(jsonb) SET search_path = public;
ALTER FUNCTION public.process_affiliate_referral(text, uuid, numeric) SET search_path = public;
ALTER FUNCTION public.generate_affiliate_code(text) SET search_path = public;
ALTER FUNCTION public.generate_sac_protocol() SET search_path = public;
ALTER FUNCTION public.generate_order_number() SET search_path = public;
ALTER FUNCTION public.generate_fiscal_note_number() SET search_path = public;
ALTER FUNCTION public.get_company_public_info() SET search_path = public;
ALTER FUNCTION public.get_public_company_info() SET search_path = public;