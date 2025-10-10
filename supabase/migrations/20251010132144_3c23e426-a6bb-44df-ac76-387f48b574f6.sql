-- FASE 1: Criação de tabelas e views para Analytics Avançado

-- 1. Tabela para relatórios agendados
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  recipients TEXT[] NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('xlsx', 'pdf', 'json')),
  filters JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para scheduled_reports
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scheduled reports"
ON public.scheduled_reports FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. View para métricas de cupons otimizada
CREATE OR REPLACE VIEW public.coupon_metrics AS
SELECT 
  c.code,
  c.type,
  c.value,
  c.current_uses,
  c.max_uses,
  c.is_active,
  c.created_at,
  c.expires_at,
  COUNT(DISTINCT cr.order_id) FILTER (WHERE o.payment_status = 'paid') as orders_completed,
  COUNT(DISTINCT cr.order_id) as orders_attempted,
  SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END) as total_revenue,
  SUM(CASE WHEN o.payment_status = 'paid' THEN cr.discount_amount ELSE 0 END) as total_discount,
  CASE 
    WHEN SUM(CASE WHEN o.payment_status = 'paid' THEN cr.discount_amount ELSE 0 END) > 0 
    THEN ((SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END) - 
           SUM(CASE WHEN o.payment_status = 'paid' THEN cr.discount_amount ELSE 0 END)) / 
          NULLIF(SUM(CASE WHEN o.payment_status = 'paid' THEN cr.discount_amount ELSE 0 END), 0)) * 100
    ELSE 0 
  END as roi_percentage,
  CASE 
    WHEN COUNT(DISTINCT cr.order_id) > 0 
    THEN (COUNT(DISTINCT cr.order_id) FILTER (WHERE o.payment_status = 'paid')::float / 
          COUNT(DISTINCT cr.order_id)::float) * 100
    ELSE 0 
  END as conversion_rate
FROM public.coupons c
LEFT JOIN public.coupon_redemptions cr ON c.code = cr.code
LEFT JOIN public.orders o ON cr.order_id = o.id
GROUP BY c.code, c.type, c.value, c.current_uses, c.max_uses, c.is_active, c.created_at, c.expires_at;

-- 3. View para análise de produtos com métricas de vendas
CREATE OR REPLACE VIEW public.products_sales_summary AS
SELECT 
  p.id,
  p.name,
  p.brand,
  p.category,
  p.avg_cost_per_ml,
  p.target_margin_percentage,
  COUNT(DISTINCT oi.order_id) as total_orders,
  SUM(oi.quantity) as total_quantity,
  SUM(oi.total_price) as total_revenue,
  AVG(oi.unit_price) as avg_price,
  SUM(oi.quantity * oi.size_ml * COALESCE(p.avg_cost_per_ml, 0)) as total_cost,
  CASE 
    WHEN SUM(oi.total_price) > 0 
    THEN ((SUM(oi.total_price) - SUM(oi.quantity * oi.size_ml * COALESCE(p.avg_cost_per_ml, 0))) / 
          NULLIF(SUM(oi.total_price), 0)) * 100
    ELSE 0 
  END as margin_percentage
FROM public.perfumes p
LEFT JOIN public.order_items oi ON p.id = oi.perfume_id
LEFT JOIN public.orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
GROUP BY p.id, p.name, p.brand, p.category, p.avg_cost_per_ml, p.target_margin_percentage;

-- 4. View para análise de cross-sell (produtos comprados juntos)
CREATE OR REPLACE VIEW public.product_cross_sell AS
SELECT 
  p1.id as product_1_id,
  p1.name as product_1_name,
  p1.brand as product_1_brand,
  p2.id as product_2_id,
  p2.name as product_2_name,
  p2.brand as product_2_brand,
  COUNT(*) as times_bought_together,
  SUM(oi1.total_price + oi2.total_price) as combined_revenue
FROM public.order_items oi1
JOIN public.order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.perfume_id < oi2.perfume_id
JOIN public.perfumes p1 ON oi1.perfume_id = p1.id
JOIN public.perfumes p2 ON oi2.perfume_id = p2.id
JOIN public.orders o ON oi1.order_id = o.id AND o.payment_status = 'paid'
GROUP BY p1.id, p1.name, p1.brand, p2.id, p2.name, p2.brand;

-- 5. Índices para otimização de performance
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_code ON public.coupon_redemptions(code);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_order_id ON public.coupon_redemptions(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_perfume_id ON public.order_items(perfume_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- Comentários para documentação
COMMENT ON TABLE public.scheduled_reports IS 'Armazena configurações de relatórios agendados para envio automático';
COMMENT ON VIEW public.coupon_metrics IS 'Métricas agregadas de performance de cupons incluindo ROI e conversão';
COMMENT ON VIEW public.products_sales_summary IS 'Resumo de vendas por produto com métricas financeiras';
COMMENT ON VIEW public.product_cross_sell IS 'Análise de produtos frequentemente comprados juntos';