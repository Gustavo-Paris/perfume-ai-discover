-- Função: Top produtos por receita
CREATE OR REPLACE FUNCTION get_top_products_by_revenue(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  perfume_id UUID,
  name TEXT,
  brand TEXT,
  total_revenue NUMERIC,
  total_quantity INTEGER,
  total_orders BIGINT,
  avg_price NUMERIC,
  avg_margin NUMERIC,
  margin_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as perfume_id,
    p.name,
    p.brand,
    COALESCE(SUM(oi.total_price), 0) as total_revenue,
    COALESCE(SUM(oi.quantity), 0)::INTEGER as total_quantity,
    COUNT(DISTINCT oi.order_id) as total_orders,
    COALESCE(AVG(oi.unit_price), 0) as avg_price,
    COALESCE(AVG(oi.unit_price - (p.avg_cost_per_ml * oi.size_ml)), 0) as avg_margin,
    COALESCE(AVG((oi.unit_price - (p.avg_cost_per_ml * oi.size_ml)) / NULLIF(oi.unit_price, 0) * 100), 0) as margin_percentage
  FROM perfumes p
  LEFT JOIN order_items oi ON p.id = oi.perfume_id
  LEFT JOIN orders o ON oi.order_id = o.id
  WHERE o.payment_status = 'paid'
  GROUP BY p.id, p.name, p.brand, p.avg_cost_per_ml
  HAVING SUM(oi.total_price) > 0
  ORDER BY total_revenue DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função: Top produtos por quantidade
CREATE OR REPLACE FUNCTION get_top_products_by_quantity(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  perfume_id UUID,
  name TEXT,
  brand TEXT,
  total_revenue NUMERIC,
  total_quantity INTEGER,
  total_orders BIGINT,
  avg_price NUMERIC,
  avg_margin NUMERIC,
  margin_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as perfume_id,
    p.name,
    p.brand,
    COALESCE(SUM(oi.total_price), 0) as total_revenue,
    COALESCE(SUM(oi.quantity), 0)::INTEGER as total_quantity,
    COUNT(DISTINCT oi.order_id) as total_orders,
    COALESCE(AVG(oi.unit_price), 0) as avg_price,
    COALESCE(AVG(oi.unit_price - (p.avg_cost_per_ml * oi.size_ml)), 0) as avg_margin,
    COALESCE(AVG((oi.unit_price - (p.avg_cost_per_ml * oi.size_ml)) / NULLIF(oi.unit_price, 0) * 100), 0) as margin_percentage
  FROM perfumes p
  LEFT JOIN order_items oi ON p.id = oi.perfume_id
  LEFT JOIN orders o ON oi.order_id = o.id
  WHERE o.payment_status = 'paid'
  GROUP BY p.id, p.name, p.brand, p.avg_cost_per_ml
  HAVING SUM(oi.quantity) > 0
  ORDER BY total_quantity DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função: Top produtos por margem
CREATE OR REPLACE FUNCTION get_top_products_by_margin(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  perfume_id UUID,
  name TEXT,
  brand TEXT,
  total_revenue NUMERIC,
  total_quantity INTEGER,
  total_orders BIGINT,
  avg_price NUMERIC,
  avg_margin NUMERIC,
  margin_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as perfume_id,
    p.name,
    p.brand,
    COALESCE(SUM(oi.total_price), 0) as total_revenue,
    COALESCE(SUM(oi.quantity), 0)::INTEGER as total_quantity,
    COUNT(DISTINCT oi.order_id) as total_orders,
    COALESCE(AVG(oi.unit_price), 0) as avg_price,
    COALESCE(AVG(oi.unit_price - (p.avg_cost_per_ml * oi.size_ml)), 0) as avg_margin,
    COALESCE(AVG((oi.unit_price - (p.avg_cost_per_ml * oi.size_ml)) / NULLIF(oi.unit_price, 0) * 100), 0) as margin_percentage
  FROM perfumes p
  LEFT JOIN order_items oi ON p.id = oi.perfume_id
  LEFT JOIN orders o ON oi.order_id = o.id
  WHERE o.payment_status = 'paid' AND p.avg_cost_per_ml > 0
  GROUP BY p.id, p.name, p.brand, p.avg_cost_per_ml
  HAVING AVG((oi.unit_price - (p.avg_cost_per_ml * oi.size_ml)) / NULLIF(oi.unit_price, 0)) > 0
  ORDER BY margin_percentage DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função: Cross-sell products
CREATE OR REPLACE FUNCTION get_cross_sell_products(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  product_1_id UUID,
  product_1_name TEXT,
  product_2_id UUID,
  product_2_name TEXT,
  times_bought_together BIGINT,
  correlation_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p1.id as product_1_id,
    p1.name as product_1_name,
    p2.id as product_2_id,
    p2.name as product_2_name,
    COUNT(*) as times_bought_together,
    (COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(DISTINCT order_id) FROM order_items), 0)) as correlation_score
  FROM order_items oi1
  JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.perfume_id < oi2.perfume_id
  JOIN perfumes p1 ON oi1.perfume_id = p1.id
  JOIN perfumes p2 ON oi2.perfume_id = p2.id
  GROUP BY p1.id, p1.name, p2.id, p2.name
  HAVING COUNT(*) > 1
  ORDER BY times_bought_together DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função: ABC Classification
CREATE OR REPLACE FUNCTION get_abc_classification()
RETURNS TABLE (
  class TEXT,
  perfume_id UUID,
  name TEXT,
  brand TEXT,
  revenue NUMERIC,
  revenue_percentage NUMERIC,
  cumulative_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH product_revenue AS (
    SELECT 
      p.id,
      p.name,
      p.brand,
      SUM(oi.total_price) as total_revenue
    FROM perfumes p
    JOIN order_items oi ON p.id = oi.perfume_id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.payment_status = 'paid'
    GROUP BY p.id, p.name, p.brand
  ),
  total AS (
    SELECT SUM(total_revenue) as total_sum
    FROM product_revenue
  ),
  ranked AS (
    SELECT 
      pr.*,
      (pr.total_revenue / t.total_sum * 100) as revenue_pct,
      SUM(pr.total_revenue / t.total_sum * 100) OVER (ORDER BY pr.total_revenue DESC) as cumulative_pct
    FROM product_revenue pr
    CROSS JOIN total t
  )
  SELECT 
    CASE 
      WHEN cumulative_pct <= 80 THEN 'A'
      WHEN cumulative_pct <= 95 THEN 'B'
      ELSE 'C'
    END as class,
    id as perfume_id,
    name,
    brand,
    total_revenue as revenue,
    revenue_pct as revenue_percentage,
    cumulative_pct as cumulative_percentage
  FROM ranked
  ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função: BCG Matrix
CREATE OR REPLACE FUNCTION get_bcg_matrix()
RETURNS TABLE (
  perfume_id UUID,
  name TEXT,
  brand TEXT,
  revenue NUMERIC,
  margin NUMERIC,
  category TEXT,
  growth_rate NUMERIC,
  market_share NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH current_period AS (
    SELECT 
      p.id,
      p.name,
      p.brand,
      SUM(oi.total_price) as revenue,
      AVG((oi.unit_price - (p.avg_cost_per_ml * oi.size_ml)) / NULLIF(oi.unit_price, 0) * 100) as margin_pct
    FROM perfumes p
    JOIN order_items oi ON p.id = oi.perfume_id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.payment_status = 'paid'
      AND o.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY p.id, p.name, p.brand
  ),
  previous_period AS (
    SELECT 
      p.id,
      SUM(oi.total_price) as revenue
    FROM perfumes p
    JOIN order_items oi ON p.id = oi.perfume_id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.payment_status = 'paid'
      AND o.created_at >= NOW() - INTERVAL '60 days'
      AND o.created_at < NOW() - INTERVAL '30 days'
    GROUP BY p.id
  ),
  market_data AS (
    SELECT 
      cp.*,
      COALESCE(
        ((cp.revenue - COALESCE(pp.revenue, 0)) / NULLIF(pp.revenue, 1)) * 100,
        0
      ) as growth,
      (cp.revenue / NULLIF((SELECT SUM(revenue) FROM current_period), 0) * 100) as share
    FROM current_period cp
    LEFT JOIN previous_period pp ON cp.id = pp.id
  )
  SELECT 
    id as perfume_id,
    name,
    brand,
    revenue,
    margin_pct as margin,
    CASE 
      WHEN growth >= 20 AND share >= 5 THEN 'star'
      WHEN growth < 20 AND share >= 5 THEN 'cash_cow'
      WHEN growth >= 20 AND share < 5 THEN 'question_mark'
      ELSE 'dog'
    END as category,
    growth as growth_rate,
    share as market_share
  FROM market_data
  WHERE revenue > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função: Product Performance
CREATE OR REPLACE FUNCTION get_product_performance()
RETURNS TABLE (
  perfume_id UUID,
  name TEXT,
  brand TEXT,
  total_revenue NUMERIC,
  total_quantity INTEGER,
  avg_margin_percentage NUMERIC,
  performance_score INTEGER,
  trend TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH current_stats AS (
    SELECT 
      p.id,
      p.name,
      p.brand,
      SUM(oi.total_price) as revenue,
      SUM(oi.quantity) as quantity,
      AVG((oi.unit_price - (p.avg_cost_per_ml * oi.size_ml)) / NULLIF(oi.unit_price, 0) * 100) as margin
    FROM perfumes p
    JOIN order_items oi ON p.id = oi.perfume_id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.payment_status = 'paid'
      AND o.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY p.id, p.name, p.brand
  ),
  previous_stats AS (
    SELECT 
      p.id,
      SUM(oi.total_price) as revenue
    FROM perfumes p
    JOIN order_items oi ON p.id = oi.perfume_id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.payment_status = 'paid'
      AND o.created_at >= NOW() - INTERVAL '60 days'
      AND o.created_at < NOW() - INTERVAL '30 days'
    GROUP BY p.id
  )
  SELECT 
    cs.id as perfume_id,
    cs.name,
    cs.brand,
    cs.revenue as total_revenue,
    cs.quantity::INTEGER as total_quantity,
    cs.margin as avg_margin_percentage,
    LEAST(100, GREATEST(0, 
      (cs.revenue / 1000 * 30)::INTEGER + 
      (cs.margin / 10)::INTEGER + 
      (cs.quantity * 2)::INTEGER
    )) as performance_score,
    CASE 
      WHEN ps.revenue IS NULL THEN 'stable'
      WHEN cs.revenue > ps.revenue * 1.1 THEN 'up'
      WHEN cs.revenue < ps.revenue * 0.9 THEN 'down'
      ELSE 'stable'
    END as trend
  FROM current_stats cs
  LEFT JOIN previous_stats ps ON cs.id = ps.id
  ORDER BY performance_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função: Dead Products (sem vendas)
CREATE OR REPLACE FUNCTION get_dead_products(p_days INTEGER DEFAULT 60)
RETURNS TABLE (
  perfume_id UUID,
  name TEXT,
  brand TEXT,
  total_revenue NUMERIC,
  total_quantity INTEGER,
  total_orders BIGINT,
  avg_price NUMERIC,
  avg_margin NUMERIC,
  margin_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as perfume_id,
    p.name,
    p.brand,
    0::NUMERIC as total_revenue,
    0::INTEGER as total_quantity,
    0::BIGINT as total_orders,
    0::NUMERIC as avg_price,
    0::NUMERIC as avg_margin,
    0::NUMERIC as margin_percentage
  FROM perfumes p
  WHERE NOT EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE oi.perfume_id = p.id
      AND o.payment_status = 'paid'
      AND o.created_at >= NOW() - (p_days || ' days')::INTERVAL
  )
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;