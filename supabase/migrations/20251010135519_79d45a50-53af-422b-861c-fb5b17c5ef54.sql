-- ==========================================
-- ORDERS ANALYTICS FUNCTIONS
-- ==========================================

-- Função: Visão Geral de Pedidos
CREATE OR REPLACE FUNCTION public.get_orders_overview(p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  total_orders BIGINT,
  pending_orders BIGINT,
  processing_orders BIGINT,
  completed_orders BIGINT,
  cancelled_orders BIGINT,
  total_revenue NUMERIC,
  avg_order_value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_orders,
    COUNT(*) FILTER (WHERE payment_status = 'pending')::BIGINT as pending_orders,
    COUNT(*) FILTER (WHERE payment_status = 'processing')::BIGINT as processing_orders,
    COUNT(*) FILTER (WHERE payment_status = 'paid')::BIGINT as completed_orders,
    COUNT(*) FILTER (WHERE payment_status = 'cancelled')::BIGINT as cancelled_orders,
    COALESCE(SUM(final_amount) FILTER (WHERE payment_status = 'paid'), 0) as total_revenue,
    COALESCE(AVG(final_amount) FILTER (WHERE payment_status = 'paid'), 0) as avg_order_value
  FROM orders
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$;

-- Função: Pedidos por Status
CREATE OR REPLACE FUNCTION public.get_orders_by_status(p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  status TEXT,
  count BIGINT,
  total_value NUMERIC,
  percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM orders
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL;

  RETURN QUERY
  SELECT 
    payment_status::TEXT as status,
    COUNT(*)::BIGINT as count,
    COALESCE(SUM(final_amount), 0) as total_value,
    COALESCE((COUNT(*)::NUMERIC / NULLIF(total_count, 0) * 100), 0) as percentage
  FROM orders
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY payment_status
  ORDER BY count DESC;
END;
$$;

-- Função: Pedidos por Período
CREATE OR REPLACE FUNCTION public.get_orders_by_period(p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  period TEXT,
  total_orders BIGINT,
  completed_orders BIGINT,
  cancelled_orders BIGINT,
  total_revenue NUMERIC,
  avg_order_value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(created_at::DATE, 'YYYY-MM-DD') as period,
    COUNT(*)::BIGINT as total_orders,
    COUNT(*) FILTER (WHERE payment_status = 'paid')::BIGINT as completed_orders,
    COUNT(*) FILTER (WHERE payment_status = 'cancelled')::BIGINT as cancelled_orders,
    COALESCE(SUM(final_amount) FILTER (WHERE payment_status = 'paid'), 0) as total_revenue,
    COALESCE(AVG(final_amount) FILTER (WHERE payment_status = 'paid'), 0) as avg_order_value
  FROM orders
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY TO_CHAR(created_at::DATE, 'YYYY-MM-DD')
  ORDER BY period;
END;
$$;

-- Função: Top Clientes
CREATE OR REPLACE FUNCTION public.get_top_customers(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  total_orders BIGINT,
  total_spent NUMERIC,
  avg_order_value NUMERIC,
  last_order_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.user_id,
    p.name as user_name,
    p.email as user_email,
    COUNT(*)::BIGINT as total_orders,
    COALESCE(SUM(o.final_amount), 0) as total_spent,
    COALESCE(AVG(o.final_amount), 0) as avg_order_value,
    MAX(o.created_at) as last_order_date
  FROM orders o
  JOIN profiles p ON o.user_id = p.id
  WHERE o.payment_status = 'paid'
  GROUP BY o.user_id, p.name, p.email
  ORDER BY total_spent DESC
  LIMIT p_limit;
END;
$$;

-- Função: Métricas de Fulfillment
CREATE OR REPLACE FUNCTION public.get_order_fulfillment_metrics(p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  avg_processing_time_hours NUMERIC,
  avg_delivery_time_days NUMERIC,
  on_time_delivery_rate NUMERIC,
  total_shipped BIGINT,
  total_delivered BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(EXTRACT(EPOCH FROM (s.shipped_at - o.created_at)) / 3600), 0) as avg_processing_time_hours,
    COALESCE(AVG(EXTRACT(EPOCH FROM (s.delivered_at - s.shipped_at)) / 86400), 0) as avg_delivery_time_days,
    COALESCE((COUNT(*) FILTER (WHERE s.delivered_at <= s.estimated_delivery)::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE s.delivered_at IS NOT NULL), 0) * 100), 0) as on_time_delivery_rate,
    COUNT(*) FILTER (WHERE s.status = 'shipped')::BIGINT as total_shipped,
    COUNT(*) FILTER (WHERE s.status = 'delivered')::BIGINT as total_delivered
  FROM orders o
  LEFT JOIN shipments s ON o.id = s.order_id
  WHERE o.created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND o.payment_status = 'paid';
END;
$$;

-- ==========================================
-- INVENTORY ANALYTICS FUNCTIONS
-- ==========================================

-- Função: Visão Geral do Inventário
CREATE OR REPLACE FUNCTION public.get_inventory_overview()
RETURNS TABLE(
  total_products BIGINT,
  total_stock_ml BIGINT,
  low_stock_items BIGINT,
  out_of_stock_items BIGINT,
  total_inventory_value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT p.id)::BIGINT as total_products,
    COALESCE(SUM(il.qty_ml), 0)::BIGINT as total_stock_ml,
    COUNT(DISTINCT p.id) FILTER (WHERE COALESCE(SUM(il.qty_ml), 0) < 100 AND COALESCE(SUM(il.qty_ml), 0) > 0)::BIGINT as low_stock_items,
    COUNT(DISTINCT p.id) FILTER (WHERE COALESCE(SUM(il.qty_ml), 0) = 0)::BIGINT as out_of_stock_items,
    COALESCE(SUM(il.qty_ml * il.cost_per_ml), 0) as total_inventory_value
  FROM perfumes p
  LEFT JOIN inventory_lots il ON p.id = il.perfume_id
  GROUP BY ();
END;
$$;

-- Função: Níveis de Estoque
CREATE OR REPLACE FUNCTION public.get_stock_levels()
RETURNS TABLE(
  perfume_id UUID,
  perfume_name TEXT,
  brand TEXT,
  category TEXT,
  current_stock_ml BIGINT,
  stock_status TEXT,
  days_of_stock INTEGER,
  reorder_recommended BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH stock_data AS (
    SELECT 
      p.id,
      p.name,
      p.brand,
      p.category,
      COALESCE(SUM(il.qty_ml), 0) as stock_ml,
      -- Estimativa simples de consumo diário (últimos 30 dias)
      COALESCE(
        (SELECT SUM(oi.quantity * oi.size_ml) / 30.0
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE oi.perfume_id = p.id
           AND o.payment_status = 'paid'
           AND o.created_at >= NOW() - INTERVAL '30 days'),
        1
      ) as daily_usage
    FROM perfumes p
    LEFT JOIN inventory_lots il ON p.id = il.perfume_id
    GROUP BY p.id, p.name, p.brand, p.category
  )
  SELECT 
    sd.id as perfume_id,
    sd.name as perfume_name,
    sd.brand,
    sd.category::TEXT,
    sd.stock_ml::BIGINT as current_stock_ml,
    CASE 
      WHEN sd.stock_ml = 0 THEN 'out'
      WHEN sd.stock_ml < 30 THEN 'critical'
      WHEN sd.stock_ml < 100 THEN 'low'
      WHEN sd.stock_ml < 300 THEN 'medium'
      ELSE 'high'
    END::TEXT as stock_status,
    GREATEST(0, (sd.stock_ml / NULLIF(sd.daily_usage, 0))::INTEGER) as days_of_stock,
    (sd.stock_ml / NULLIF(sd.daily_usage, 0) < 7) as reorder_recommended
  FROM stock_data sd
  ORDER BY 
    CASE 
      WHEN sd.stock_ml = 0 THEN 1
      WHEN sd.stock_ml < 30 THEN 2
      WHEN sd.stock_ml < 100 THEN 3
      ELSE 4
    END,
    sd.name;
END;
$$;

-- Função: Movimentações de Estoque
CREATE OR REPLACE FUNCTION public.get_stock_movements(p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  period TEXT,
  purchases_ml BIGINT,
  sales_ml BIGINT,
  adjustments_ml BIGINT,
  net_change_ml BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH movements AS (
    -- Compras (entradas de lotes)
    SELECT 
      TO_CHAR(il.created_at::DATE, 'YYYY-MM-DD') as period,
      SUM(il.qty_ml) as purchases,
      0 as sales,
      0 as adjustments
    FROM inventory_lots il
    WHERE il.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY TO_CHAR(il.created_at::DATE, 'YYYY-MM-DD')
    
    UNION ALL
    
    -- Vendas (saídas por pedidos)
    SELECT 
      TO_CHAR(o.created_at::DATE, 'YYYY-MM-DD') as period,
      0 as purchases,
      SUM(oi.quantity * oi.size_ml) as sales,
      0 as adjustments
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.payment_status = 'paid'
      AND o.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY TO_CHAR(o.created_at::DATE, 'YYYY-MM-DD')
    
    UNION ALL
    
    -- Ajustes (movimentações manuais)
    SELECT 
      TO_CHAR(mm.created_at::DATE, 'YYYY-MM-DD') as period,
      0 as purchases,
      0 as sales,
      SUM(mm.quantity) as adjustments
    FROM material_movements mm
    WHERE mm.created_at >= NOW() - (p_days || ' days')::INTERVAL
      AND mm.movement_type IN ('adjustment', 'transfer')
    GROUP BY TO_CHAR(mm.created_at::DATE, 'YYYY-MM-DD')
  )
  SELECT 
    m.period,
    COALESCE(SUM(m.purchases), 0)::BIGINT as purchases_ml,
    COALESCE(SUM(m.sales), 0)::BIGINT as sales_ml,
    COALESCE(SUM(m.adjustments), 0)::BIGINT as adjustments_ml,
    (COALESCE(SUM(m.purchases), 0) - COALESCE(SUM(m.sales), 0) + COALESCE(SUM(m.adjustments), 0))::BIGINT as net_change_ml
  FROM movements m
  GROUP BY m.period
  ORDER BY m.period;
END;
$$;

-- Função: Giro de Inventário
CREATE OR REPLACE FUNCTION public.get_inventory_turnover(p_days INTEGER DEFAULT 90)
RETURNS TABLE(
  perfume_id UUID,
  perfume_name TEXT,
  brand TEXT,
  avg_stock_ml NUMERIC,
  sold_ml BIGINT,
  turnover_rate NUMERIC,
  days_to_sell INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as perfume_id,
    p.name as perfume_name,
    p.brand,
    COALESCE(AVG(il.qty_ml), 0) as avg_stock_ml,
    COALESCE(SUM(oi.quantity * oi.size_ml), 0)::BIGINT as sold_ml,
    COALESCE(
      SUM(oi.quantity * oi.size_ml) / NULLIF(AVG(il.qty_ml), 0),
      0
    ) as turnover_rate,
    COALESCE(
      (p_days / NULLIF(SUM(oi.quantity * oi.size_ml) / NULLIF(AVG(il.qty_ml), 0), 0))::INTEGER,
      999
    ) as days_to_sell
  FROM perfumes p
  LEFT JOIN inventory_lots il ON p.id = il.perfume_id
  LEFT JOIN order_items oi ON p.id = oi.perfume_id
  LEFT JOIN orders o ON oi.order_id = o.id
    AND o.payment_status = 'paid'
    AND o.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY p.id, p.name, p.brand
  HAVING SUM(oi.quantity * oi.size_ml) > 0
  ORDER BY turnover_rate DESC;
END;
$$;

-- Função: Expirações de Lotes
CREATE OR REPLACE FUNCTION public.get_lot_expirations()
RETURNS TABLE(
  lot_id UUID,
  perfume_name TEXT,
  brand TEXT,
  lot_code TEXT,
  qty_ml INTEGER,
  expiry_date DATE,
  days_until_expiry INTEGER,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    il.id as lot_id,
    p.name as perfume_name,
    p.brand,
    il.lot_code,
    il.qty_ml,
    il.expiry_date,
    (il.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry,
    CASE 
      WHEN il.expiry_date < CURRENT_DATE THEN 'expired'
      WHEN il.expiry_date < CURRENT_DATE + INTERVAL '7 days' THEN 'critical'
      WHEN il.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'warning'
      ELSE 'good'
    END::TEXT as status
  FROM inventory_lots il
  JOIN perfumes p ON il.perfume_id = p.id
  WHERE il.expiry_date IS NOT NULL
    AND il.qty_ml > 0
  ORDER BY il.expiry_date;
END;
$$;