-- 6. Alertas de estoque baixo automáticos (melhorado)

-- Tabela para configurações de alertas por perfume
CREATE TABLE stock_alert_configs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  perfume_id uuid REFERENCES perfumes(id) ON DELETE CASCADE,
  
  -- Limites personalizados por perfume
  critical_threshold_ml integer DEFAULT 10, -- Crítico
  low_threshold_ml integer DEFAULT 30,      -- Baixo
  medium_threshold_ml integer DEFAULT 100,  -- Médio
  
  -- Configurações de alertas
  alert_enabled boolean DEFAULT true,
  auto_reorder boolean DEFAULT false,
  preferred_reorder_quantity integer DEFAULT 500,
  
  -- Histórico de vendas para previsão
  avg_monthly_sales_ml numeric DEFAULT 0,
  last_sales_calculation timestamp,
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  UNIQUE(perfume_id)
);

-- Tabela para histórico de alertas enviados
CREATE TABLE stock_alert_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  perfume_id uuid REFERENCES perfumes(id) ON DELETE CASCADE,
  alert_type text NOT NULL, -- critical, low, reorder_suggestion
  
  -- Estado no momento do alerta
  stock_ml_at_alert integer,
  threshold_triggered integer,
  days_until_stockout integer, -- Previsão baseada em vendas
  
  -- Ação tomada
  notification_sent boolean DEFAULT false,
  admin_notified boolean DEFAULT false,
  auto_reorder_triggered boolean DEFAULT false,
  
  created_at timestamp DEFAULT now()
);

-- Índices
CREATE INDEX idx_stock_alert_configs_perfume ON stock_alert_configs(perfume_id);
CREATE INDEX idx_stock_alert_history_perfume ON stock_alert_history(perfume_id, created_at DESC);
CREATE INDEX idx_stock_alert_history_type ON stock_alert_history(alert_type, created_at DESC);

-- RLS
ALTER TABLE stock_alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage stock alert configs" ON stock_alert_configs
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view stock alert history" ON stock_alert_history
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert alert history" ON stock_alert_history
  FOR INSERT WITH CHECK (true);

-- Função melhorada para verificar alertas de estoque
CREATE OR REPLACE FUNCTION check_advanced_stock_alerts()
RETURNS TABLE(
  perfume_id uuid,
  perfume_name text,
  brand text,
  current_stock_ml integer,
  alert_level text,
  days_until_stockout integer,
  should_reorder boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  perfume_record RECORD;
  config_record RECORD;
  current_stock integer;
  daily_usage numeric;
  days_remaining integer;
  alert_level_val text;
  should_reorder_val boolean;
BEGIN
  -- Percorrer todos os perfumes com lotes
  FOR perfume_record IN
    SELECT DISTINCT p.id, p.name, p.brand
    FROM perfumes p
    JOIN inventory_lots il ON p.id = il.perfume_id
  LOOP
    -- Buscar configuração de alerta
    SELECT * INTO config_record
    FROM stock_alert_configs
    WHERE perfume_id = perfume_record.id;
    
    -- Se não há configuração, usar padrões
    IF NOT FOUND THEN
      INSERT INTO stock_alert_configs (perfume_id)
      VALUES (perfume_record.id)
      RETURNING * INTO config_record;
    END IF;
    
    -- Calcular estoque atual
    SELECT COALESCE(SUM(il.qty_ml), 0)
    INTO current_stock
    FROM inventory_lots il
    WHERE il.perfume_id = perfume_record.id;
    
    -- Determinar nível de alerta
    alert_level_val := CASE
      WHEN current_stock <= config_record.critical_threshold_ml THEN 'critical'
      WHEN current_stock <= config_record.low_threshold_ml THEN 'low'
      WHEN current_stock <= config_record.medium_threshold_ml THEN 'medium'
      ELSE 'normal'
    END;
    
    -- Calcular previsão de dias até acabar (baseado em vendas médias)
    daily_usage := GREATEST(config_record.avg_monthly_sales_ml / 30.0, 1); -- Mínimo 1ml/dia
    days_remaining := CASE
      WHEN daily_usage > 0 THEN (current_stock / daily_usage)::integer
      ELSE 999
    END;
    
    -- Determinar se deve fazer reposição
    should_reorder_val := (
      config_record.auto_reorder = true AND
      (alert_level_val IN ('critical', 'low') OR days_remaining <= 7)
    );
    
    -- Retornar apenas alertas que precisam de atenção
    IF alert_level_val != 'normal' OR should_reorder_val THEN
      RETURN QUERY SELECT 
        perfume_record.id,
        perfume_record.name,
        perfume_record.brand,
        current_stock,
        alert_level_val,
        days_remaining,
        should_reorder_val;
      
      -- Registrar no histórico se é um novo alerta
      IF NOT EXISTS (
        SELECT 1 FROM stock_alert_history 
        WHERE perfume_id = perfume_record.id 
          AND alert_type = alert_level_val
          AND created_at > now() - interval '24 hours'
      ) THEN
        INSERT INTO stock_alert_history (
          perfume_id, alert_type, stock_ml_at_alert, 
          threshold_triggered, days_until_stockout
        )
        VALUES (
          perfume_record.id, alert_level_val, current_stock,
          CASE alert_level_val
            WHEN 'critical' THEN config_record.critical_threshold_ml
            WHEN 'low' THEN config_record.low_threshold_ml
            ELSE config_record.medium_threshold_ml
          END,
          days_remaining
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Função para atualizar estatísticas de vendas
CREATE OR REPLACE FUNCTION update_sales_statistics()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer := 0;
  perfume_record RECORD;
  monthly_sales numeric;
BEGIN
  FOR perfume_record IN
    SELECT DISTINCT perfume_id FROM order_items
  LOOP
    -- Calcular vendas médias mensais dos últimos 3 meses
    SELECT COALESCE(
      AVG(monthly_total) * 
      AVG(CASE WHEN size_ml = 5 THEN 5 WHEN size_ml = 10 THEN 10 ELSE 50 END), 
      0
    )
    INTO monthly_sales
    FROM (
      SELECT 
        DATE_TRUNC('month', o.created_at) as month,
        SUM(oi.quantity) as monthly_total,
        oi.size_ml
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.perfume_id = perfume_record.perfume_id
        AND o.payment_status = 'paid'
        AND o.created_at > now() - interval '3 months'
      GROUP BY DATE_TRUNC('month', o.created_at), oi.size_ml
    ) monthly_stats;
    
    -- Atualizar configuração
    INSERT INTO stock_alert_configs (perfume_id, avg_monthly_sales_ml, last_sales_calculation)
    VALUES (perfume_record.perfume_id, monthly_sales, now())
    ON CONFLICT (perfume_id) 
    DO UPDATE SET 
      avg_monthly_sales_ml = monthly_sales,
      last_sales_calculation = now(),
      updated_at = now();
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$;