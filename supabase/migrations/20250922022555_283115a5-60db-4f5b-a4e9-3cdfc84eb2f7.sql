-- Ajustar função de correção automática para incluir correção de margens baixas
CREATE OR REPLACE FUNCTION public.auto_fix_perfume_prices()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fixed_count INTEGER := 0;
  error_count INTEGER := 0;
  perfume_record RECORD;
  result_json JSONB;
  start_time TIMESTAMP := clock_timestamp();
  default_margin NUMERIC := 2.0; -- 100% margem (preço = 2x o custo)
BEGIN
  -- Log início da operação
  INSERT INTO price_calculation_logs (action_type, trigger_source)
  VALUES ('batch_auto_fix', 'scheduled_check');
  
  -- Para cada perfume com problema (incluindo margens baixas)
  FOR perfume_record IN 
    SELECT perfume_id, issue_type FROM check_price_integrity()
    WHERE issue_type IN ('zero_prices', 'zero_cost', 'low_margin', 'high_margin')
  LOOP
    BEGIN
      -- Se for problema de margem, ajustar para margem padrão
      IF perfume_record.issue_type IN ('low_margin', 'high_margin') THEN
        -- Atualizar margem para valor padrão (100% = multiplicador 2.0)
        UPDATE perfumes 
        SET target_margin_percentage = default_margin,
            updated_at = now()
        WHERE id = perfume_record.perfume_id;
        
        -- Log da correção de margem
        INSERT INTO price_calculation_logs (
          perfume_id, action_type, trigger_source, 
          old_prices, new_prices
        ) VALUES (
          perfume_record.perfume_id, 'margin_auto_fix', 'auto_fix_batch',
          jsonb_build_object('issue_type', perfume_record.issue_type),
          jsonb_build_object('new_margin', default_margin)
        );
      END IF;
      
      -- Primeiro, atualizar custo médio
      PERFORM update_perfume_avg_cost_safe(perfume_record.perfume_id);
      
      -- Depois, recalcular preços usando a nova margem
      PERFORM recalculate_perfume_prices_for_sizes(
        perfume_record.perfume_id, 
        ARRAY[2, 5, 10, 50]
      );
      
      fixed_count := fixed_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      
      INSERT INTO price_calculation_logs (
        perfume_id, action_type, trigger_source, error_message
      ) VALUES (
        perfume_record.perfume_id, 'auto_fix_error', 'scheduled_check', SQLERRM
      );
    END;
  END LOOP;
  
  -- Preparar resultado
  result_json := jsonb_build_object(
    'fixed_count', fixed_count,
    'error_count', error_count,
    'execution_time_ms', EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) * 1000,
    'timestamp', now(),
    'default_margin_applied', default_margin
  );
  
  -- Log resultado final
  UPDATE price_calculation_logs 
  SET new_prices = result_json,
      execution_time_ms = EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) * 1000
  WHERE action_type = 'batch_auto_fix' 
    AND created_at >= start_time;
  
  RETURN result_json;
END;
$$;

-- Criar função específica para ajustar margem de um perfume individual
CREATE OR REPLACE FUNCTION public.fix_perfume_margin(
  perfume_uuid UUID,
  new_margin_percentage NUMERIC DEFAULT 2.0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_margin NUMERIC;
  start_time TIMESTAMP := clock_timestamp();
BEGIN
  -- Capturar margem atual
  SELECT target_margin_percentage INTO old_margin
  FROM perfumes WHERE id = perfume_uuid;
  
  -- Atualizar margem
  UPDATE perfumes 
  SET target_margin_percentage = new_margin_percentage,
      updated_at = now()
  WHERE id = perfume_uuid;
  
  -- Log da operação
  INSERT INTO price_calculation_logs (
    perfume_id, action_type, trigger_source,
    old_prices, new_prices, execution_time_ms
  ) VALUES (
    perfume_uuid, 'margin_correction', 'manual_fix',
    jsonb_build_object('old_margin', old_margin),
    jsonb_build_object('new_margin', new_margin_percentage),
    EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) * 1000
  );
  
  -- Atualizar custo médio e recalcular preços
  PERFORM update_perfume_avg_cost_safe(perfume_uuid);
  PERFORM recalculate_perfume_prices_for_sizes(perfume_uuid, ARRAY[2, 5, 10, 50]);
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO price_calculation_logs (
    perfume_id, action_type, trigger_source, error_message
  ) VALUES (
    perfume_uuid, 'margin_correction_error', 'manual_fix', SQLERRM
  );
  
  RETURN FALSE;
END;
$$;