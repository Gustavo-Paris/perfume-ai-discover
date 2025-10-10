-- Função: Performance de Cupons
CREATE OR REPLACE FUNCTION public.get_coupon_performance(p_limit INTEGER DEFAULT 20)
RETURNS TABLE(
  coupon_id UUID,
  code TEXT,
  type TEXT,
  value NUMERIC,
  total_uses BIGINT,
  total_revenue NUMERIC,
  total_discount_given NUMERIC,
  avg_order_value NUMERIC,
  conversion_rate NUMERIC,
  roi NUMERIC,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as coupon_id,
    c.code,
    c.type::TEXT,
    c.value,
    COUNT(DISTINCT o.id) as total_uses,
    COALESCE(SUM(o.total_amount), 0) as total_revenue,
    COALESCE(SUM(o.total_amount - o.final_amount), 0) as total_discount_given,
    COALESCE(AVG(o.final_amount), 0) as avg_order_value,
    COALESCE(
      COUNT(DISTINCT o.id)::NUMERIC / NULLIF(COUNT(DISTINCT o.user_id), 0),
      0
    ) as conversion_rate,
    COALESCE(
      SUM(o.final_amount) / NULLIF(SUM(o.total_amount - o.final_amount), 0),
      0
    ) as roi,
    c.created_at,
    c.expires_at
  FROM coupons c
  LEFT JOIN orders o ON c.code = o.coupon_code AND o.payment_status = 'paid'
  WHERE c.is_active = true
  GROUP BY c.id, c.code, c.type, c.value, c.created_at, c.expires_at
  HAVING COUNT(DISTINCT o.id) > 0
  ORDER BY total_revenue DESC
  LIMIT p_limit;
END;
$$;

-- Função: Métricas de Campanha
CREATE OR REPLACE FUNCTION public.get_campaign_metrics(p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  period TEXT,
  total_orders BIGINT,
  orders_with_coupon BIGINT,
  coupon_usage_rate NUMERIC,
  total_revenue NUMERIC,
  revenue_with_coupon NUMERIC,
  total_discount_given NUMERIC,
  avg_discount_per_order NUMERIC,
  net_revenue NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(o.created_at::DATE, 'YYYY-MM-DD') as period,
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE o.coupon_code IS NOT NULL) as orders_with_coupon,
    COALESCE(
      COUNT(*) FILTER (WHERE o.coupon_code IS NOT NULL)::NUMERIC / NULLIF(COUNT(*), 0),
      0
    ) as coupon_usage_rate,
    COALESCE(SUM(o.total_amount), 0) as total_revenue,
    COALESCE(SUM(o.final_amount) FILTER (WHERE o.coupon_code IS NOT NULL), 0) as revenue_with_coupon,
    COALESCE(SUM(o.total_amount - o.final_amount), 0) as total_discount_given,
    COALESCE(AVG(o.total_amount - o.final_amount), 0) as avg_discount_per_order,
    COALESCE(SUM(o.final_amount), 0) as net_revenue
  FROM orders o
  WHERE o.payment_status = 'paid'
    AND o.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY TO_CHAR(o.created_at::DATE, 'YYYY-MM-DD')
  ORDER BY period DESC;
END;
$$;

-- Função: Top Usuários de Cupons
CREATE OR REPLACE FUNCTION public.get_top_coupon_users(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  total_uses BIGINT,
  total_saved NUMERIC,
  total_spent NUMERIC,
  avg_order_value NUMERIC,
  first_use TIMESTAMPTZ,
  last_use TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.user_id,
    p.email as user_email,
    p.name as user_name,
    COUNT(*) as total_uses,
    COALESCE(SUM(o.total_amount - o.final_amount), 0) as total_saved,
    COALESCE(SUM(o.final_amount), 0) as total_spent,
    COALESCE(AVG(o.final_amount), 0) as avg_order_value,
    MIN(o.created_at) as first_use,
    MAX(o.created_at) as last_use
  FROM orders o
  JOIN profiles p ON o.user_id = p.id
  WHERE o.coupon_code IS NOT NULL
    AND o.payment_status = 'paid'
  GROUP BY o.user_id, p.email, p.name
  ORDER BY total_uses DESC
  LIMIT p_limit;
END;
$$;

-- Função: Análise por Tipo de Cupom
CREATE OR REPLACE FUNCTION public.get_coupon_type_analysis()
RETURNS TABLE(
  type TEXT,
  total_coupons BIGINT,
  active_coupons BIGINT,
  total_uses BIGINT,
  total_revenue NUMERIC,
  total_discount NUMERIC,
  avg_conversion_rate NUMERIC,
  roi NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.type::TEXT,
    COUNT(DISTINCT c.id) as total_coupons,
    COUNT(DISTINCT c.id) FILTER (WHERE c.is_active = true) as active_coupons,
    COUNT(DISTINCT o.id) as total_uses,
    COALESCE(SUM(o.final_amount), 0) as total_revenue,
    COALESCE(SUM(o.total_amount - o.final_amount), 0) as total_discount,
    COALESCE(AVG(
      COUNT(DISTINCT o.id)::NUMERIC / NULLIF(COUNT(DISTINCT o.user_id), 0)
    ), 0) as avg_conversion_rate,
    COALESCE(
      SUM(o.final_amount) / NULLIF(SUM(o.total_amount - o.final_amount), 0),
      0
    ) as roi
  FROM coupons c
  LEFT JOIN orders o ON c.code = o.coupon_code AND o.payment_status = 'paid'
  GROUP BY c.type
  ORDER BY total_revenue DESC;
END;
$$;