-- Corrigir avisos de segurança das funções
CREATE OR REPLACE FUNCTION public.update_perfume_avg_cost_safe(perfume_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_cost NUMERIC := 0;
  total_ml INTEGER := 0;
  avg_cost NUMERIC := 0;
  error_msg TEXT;
BEGIN
  -- Log início da operação
  INSERT INTO price_calculation_logs (perfume_id, action_type, trigger_source)
  VALUES (perfume_uuid, 'cost_update', 'avg_cost_calculation');
  
  -- Calcular custo médio com proteção contra divisão por zero
  SELECT 
    COALESCE(SUM(il.cost_per_ml * il.qty_ml), 0),
    COALESCE(SUM(il.qty_ml), 0)
  INTO total_cost, total_ml
  FROM inventory_lots il
  WHERE il.perfume_id = perfume_uuid;
  
  -- Verificar se há dados válidos
  IF total_ml > 0 THEN
    avg_cost := total_cost / total_ml;
  ELSE
    avg_cost := 0;
  END IF;
  
  -- Atualizar perfume
  UPDATE perfumes 
  SET avg_cost_per_ml = avg_cost,
      updated_at = now()
  WHERE id = perfume_uuid;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  error_msg := SQLERRM;
  
  -- Log do erro
  INSERT INTO price_calculation_logs (perfume_id, action_type, trigger_source, error_message)
  VALUES (perfume_uuid, 'cost_update_error', 'avg_cost_calculation', error_msg);
  
  RAISE WARNING 'Erro ao atualizar custo médio do perfume %: %', perfume_uuid, error_msg;
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_price_integrity()
RETURNS TABLE(
  perfume_id UUID,
  perfume_name TEXT,
  brand TEXT,
  issue_type TEXT,
  current_prices JSONB,
  suggested_action TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH price_analysis AS (
    SELECT 
      p.id,
      p.name,
      p.brand,
      p.price_2ml,
      p.price_5ml,
      p.price_10ml,
      p.price_full,
      p.avg_cost_per_ml,
      CASE 
        WHEN p.price_5ml <= 0 AND p.price_10ml <= 0 THEN 'zero_prices'
        WHEN p.avg_cost_per_ml <= 0 THEN 'zero_cost'
        WHEN p.price_5ml > 0 AND p.avg_cost_per_ml > 0 AND (p.price_5ml / (p.avg_cost_per_ml * 5)) < 1.1 THEN 'low_margin'
        WHEN p.price_5ml > 0 AND p.avg_cost_per_ml > 0 AND (p.price_5ml / (p.avg_cost_per_ml * 5)) > 10 THEN 'high_margin'
        ELSE 'ok'
      END as issue
    FROM perfumes p
  )
  SELECT 
    pa.id,
    pa.name,
    pa.brand,
    pa.issue,
    jsonb_build_object(
      'price_2ml', pa.price_2ml,
      'price_5ml', pa.price_5ml,
      'price_10ml', pa.price_10ml,
      'price_full', pa.price_full,
      'avg_cost_per_ml', pa.avg_cost_per_ml
    ),
    CASE pa.issue
      WHEN 'zero_prices' THEN 'Recalcular preços usando margem padrão'
      WHEN 'zero_cost' THEN 'Atualizar custo médio do perfume'
      WHEN 'low_margin' THEN 'Verificar margem muito baixa'
      WHEN 'high_margin' THEN 'Verificar margem muito alta'
      ELSE 'OK'
    END
  FROM price_analysis pa
  WHERE pa.issue != 'ok';
END;
$$;