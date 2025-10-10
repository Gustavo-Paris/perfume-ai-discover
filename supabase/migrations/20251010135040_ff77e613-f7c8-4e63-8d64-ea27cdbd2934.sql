-- Função: Métricas de Receita
CREATE OR REPLACE FUNCTION public.get_revenue_metrics(p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  period TEXT,
  total_revenue NUMERIC,
  total_orders BIGINT,
  avg_order_value NUMERIC,
  total_cost NUMERIC,
  gross_profit NUMERIC,
  profit_margin NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(o.created_at::DATE, 'YYYY-MM-DD') as period,
    COALESCE(SUM(o.final_amount), 0) as total_revenue,
    COUNT(*) as total_orders,
    COALESCE(AVG(o.final_amount), 0) as avg_order_value,
    COALESCE(SUM(
      (SELECT SUM(oi.quantity * oi.size_ml * p.avg_cost_per_ml)
       FROM order_items oi
       JOIN perfumes p ON oi.perfume_id = p.id
       WHERE oi.order_id = o.id)
    ), 0) as total_cost,
    COALESCE(SUM(o.final_amount) - SUM(
      (SELECT SUM(oi.quantity * oi.size_ml * p.avg_cost_per_ml)
       FROM order_items oi
       JOIN perfumes p ON oi.perfume_id = p.id
       WHERE oi.order_id = o.id)
    ), 0) as gross_profit,
    COALESCE(
      (SUM(o.final_amount) - SUM(
        (SELECT SUM(oi.quantity * oi.size_ml * p.avg_cost_per_ml)
         FROM order_items oi
         JOIN perfumes p ON oi.perfume_id = p.id
         WHERE oi.order_id = o.id)
      )) / NULLIF(SUM(o.final_amount), 0) * 100,
      0
    ) as profit_margin
  FROM orders o
  WHERE o.payment_status = 'paid'
    AND o.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY TO_CHAR(o.created_at::DATE, 'YYYY-MM-DD')
  ORDER BY period;
END;
$$;

-- Função: Categorias de Despesas
CREATE OR REPLACE FUNCTION public.get_expense_categories(p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  category TEXT,
  total_amount NUMERIC,
  percentage_of_revenue NUMERIC,
  transaction_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_revenue NUMERIC;
BEGIN
  -- Calcular receita total do período
  SELECT COALESCE(SUM(final_amount), 0) INTO total_revenue
  FROM orders
  WHERE payment_status = 'paid'
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  RETURN QUERY
  SELECT 
    'Materiais'::TEXT as category,
    COALESCE(SUM(ml.total_cost), 0) as total_amount,
    COALESCE(SUM(ml.total_cost) / NULLIF(total_revenue, 0) * 100, 0) as percentage_of_revenue,
    COUNT(*) as transaction_count
  FROM material_lots ml
  WHERE ml.created_at >= NOW() - (p_days || ' days')::INTERVAL
  
  UNION ALL
  
  SELECT 
    'Frete'::TEXT as category,
    COALESCE(SUM(o.shipping_cost), 0) as total_amount,
    COALESCE(SUM(o.shipping_cost) / NULLIF(total_revenue, 0) * 100, 0) as percentage_of_revenue,
    COUNT(*) FILTER (WHERE o.shipping_cost > 0) as transaction_count
  FROM orders o
  WHERE o.payment_status = 'paid'
    AND o.created_at >= NOW() - (p_days || ' days')::INTERVAL
  
  UNION ALL
  
  SELECT 
    'Descontos'::TEXT as category,
    COALESCE(SUM(o.total_amount - o.final_amount), 0) as total_amount,
    COALESCE(SUM(o.total_amount - o.final_amount) / NULLIF(total_revenue, 0) * 100, 0) as percentage_of_revenue,
    COUNT(*) FILTER (WHERE o.coupon_code IS NOT NULL) as transaction_count
  FROM orders o
  WHERE o.payment_status = 'paid'
    AND o.created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$;

-- Função: Análise de Fluxo de Caixa
CREATE OR REPLACE FUNCTION public.get_cash_flow_analysis(p_days INTEGER DEFAULT 90)
RETURNS TABLE(
  period TEXT,
  cash_in NUMERIC,
  cash_out NUMERIC,
  net_cash_flow NUMERIC,
  cumulative_balance NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH daily_cash AS (
    SELECT 
      TO_CHAR(date::DATE, 'YYYY-MM-DD') as period,
      COALESCE(SUM(cash_in), 0) as cash_in,
      COALESCE(SUM(cash_out), 0) as cash_out
    FROM (
      -- Entradas (vendas)
      SELECT 
        o.created_at::DATE as date,
        o.final_amount as cash_in,
        0 as cash_out
      FROM orders o
      WHERE o.payment_status = 'paid'
        AND o.created_at >= NOW() - (p_days || ' days')::INTERVAL
      
      UNION ALL
      
      -- Saídas (materiais)
      SELECT 
        ml.created_at::DATE as date,
        0 as cash_in,
        ml.total_cost as cash_out
      FROM material_lots ml
      WHERE ml.created_at >= NOW() - (p_days || ' days')::INTERVAL
    ) cash_flows
    GROUP BY date::DATE
  )
  SELECT 
    dc.period,
    dc.cash_in,
    dc.cash_out,
    (dc.cash_in - dc.cash_out) as net_cash_flow,
    SUM(dc.cash_in - dc.cash_out) OVER (ORDER BY dc.period) as cumulative_balance
  FROM daily_cash dc
  ORDER BY dc.period;
END;
$$;

-- Função: Análise de Métodos de Pagamento
CREATE OR REPLACE FUNCTION public.get_payment_method_analysis(p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  payment_method TEXT,
  total_transactions BIGINT,
  total_amount NUMERIC,
  avg_transaction_value NUMERIC,
  percentage_of_total NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_sales NUMERIC;
BEGIN
  -- Calcular total de vendas
  SELECT COALESCE(SUM(final_amount), 0) INTO total_sales
  FROM orders
  WHERE payment_status = 'paid'
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  RETURN QUERY
  SELECT 
    o.payment_method::TEXT,
    COUNT(*) as total_transactions,
    COALESCE(SUM(o.final_amount), 0) as total_amount,
    COALESCE(AVG(o.final_amount), 0) as avg_transaction_value,
    COALESCE(SUM(o.final_amount) / NULLIF(total_sales, 0) * 100, 0) as percentage_of_total
  FROM orders o
  WHERE o.payment_status = 'paid'
    AND o.created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND o.payment_method IS NOT NULL
  GROUP BY o.payment_method
  ORDER BY total_amount DESC;
END;
$$;

-- Função: Lucro por Categoria
CREATE OR REPLACE FUNCTION public.get_profit_by_category(p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  category TEXT,
  total_revenue NUMERIC,
  total_cost NUMERIC,
  gross_profit NUMERIC,
  profit_margin NUMERIC,
  units_sold BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.category::TEXT,
    COALESCE(SUM(oi.total_price), 0) as total_revenue,
    COALESCE(SUM(oi.quantity * oi.size_ml * p.avg_cost_per_ml), 0) as total_cost,
    COALESCE(SUM(oi.total_price) - SUM(oi.quantity * oi.size_ml * p.avg_cost_per_ml), 0) as gross_profit,
    COALESCE(
      (SUM(oi.total_price) - SUM(oi.quantity * oi.size_ml * p.avg_cost_per_ml)) / 
      NULLIF(SUM(oi.total_price), 0) * 100,
      0
    ) as profit_margin,
    SUM(oi.quantity) as units_sold
  FROM order_items oi
  JOIN perfumes p ON oi.perfume_id = p.id
  JOIN orders o ON oi.order_id = o.id
  WHERE o.payment_status = 'paid'
    AND o.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY p.category
  ORDER BY total_revenue DESC;
END;
$$;

-- Função: Comparação Mensal
CREATE OR REPLACE FUNCTION public.get_monthly_comparison()
RETURNS TABLE(
  metric TEXT,
  current_month NUMERIC,
  previous_month NUMERIC,
  change_percentage NUMERIC,
  trend TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  curr_revenue NUMERIC;
  prev_revenue NUMERIC;
  curr_profit NUMERIC;
  prev_profit NUMERIC;
  curr_orders NUMERIC;
  prev_orders NUMERIC;
BEGIN
  -- Receita atual
  SELECT COALESCE(SUM(final_amount), 0) INTO curr_revenue
  FROM orders
  WHERE payment_status = 'paid'
    AND created_at >= DATE_TRUNC('month', NOW());
  
  -- Receita anterior
  SELECT COALESCE(SUM(final_amount), 0) INTO prev_revenue
  FROM orders
  WHERE payment_status = 'paid'
    AND created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
    AND created_at < DATE_TRUNC('month', NOW());
  
  -- Lucro atual
  SELECT COALESCE(SUM(o.final_amount) - SUM(
    (SELECT SUM(oi.quantity * oi.size_ml * p.avg_cost_per_ml)
     FROM order_items oi
     JOIN perfumes p ON oi.perfume_id = p.id
     WHERE oi.order_id = o.id)
  ), 0) INTO curr_profit
  FROM orders o
  WHERE o.payment_status = 'paid'
    AND o.created_at >= DATE_TRUNC('month', NOW());
  
  -- Lucro anterior
  SELECT COALESCE(SUM(o.final_amount) - SUM(
    (SELECT SUM(oi.quantity * oi.size_ml * p.avg_cost_per_ml)
     FROM order_items oi
     JOIN perfumes p ON oi.perfume_id = p.id
     WHERE oi.order_id = o.id)
  ), 0) INTO prev_profit
  FROM orders o
  WHERE o.payment_status = 'paid'
    AND o.created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
    AND o.created_at < DATE_TRUNC('month', NOW());
  
  -- Pedidos atuais
  SELECT COUNT(*)::NUMERIC INTO curr_orders
  FROM orders
  WHERE payment_status = 'paid'
    AND created_at >= DATE_TRUNC('month', NOW());
  
  -- Pedidos anteriores
  SELECT COUNT(*)::NUMERIC INTO prev_orders
  FROM orders
  WHERE payment_status = 'paid'
    AND created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
    AND created_at < DATE_TRUNC('month', NOW());
  
  RETURN QUERY
  SELECT 
    'revenue'::TEXT,
    curr_revenue,
    prev_revenue,
    COALESCE((curr_revenue - prev_revenue) / NULLIF(prev_revenue, 0) * 100, 0),
    CASE 
      WHEN curr_revenue > prev_revenue * 1.05 THEN 'up'
      WHEN curr_revenue < prev_revenue * 0.95 THEN 'down'
      ELSE 'stable'
    END::TEXT
  
  UNION ALL
  
  SELECT 
    'profit'::TEXT,
    curr_profit,
    prev_profit,
    COALESCE((curr_profit - prev_profit) / NULLIF(prev_profit, 0) * 100, 0),
    CASE 
      WHEN curr_profit > prev_profit * 1.05 THEN 'up'
      WHEN curr_profit < prev_profit * 0.95 THEN 'down'
      ELSE 'stable'
    END::TEXT
  
  UNION ALL
  
  SELECT 
    'orders'::TEXT,
    curr_orders,
    prev_orders,
    COALESCE((curr_orders - prev_orders) / NULLIF(prev_orders, 0) * 100, 0),
    CASE 
      WHEN curr_orders > prev_orders * 1.05 THEN 'up'
      WHEN curr_orders < prev_orders * 0.95 THEN 'down'
      ELSE 'stable'
    END::TEXT;
END;
$$;