-- Ajustar margem padrão para garantir que fique acima do limite mínimo
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
  default_margin NUMERIC := 2.5; -- 150% margem para garantir que fique acima de 1.5x
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
      -- Se for problema de margem baixa ou alta, ajustar para margem segura
      IF perfume_record.issue_type IN ('low_margin', 'high_margin') THEN
        UPDATE perfumes 
        SET target_margin_percentage = default_margin
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
      
      -- Atualizar custo médio
      PERFORM update_perfume_avg_cost_safe(perfume_record.perfume_id);
      
      -- Recalcular preços
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

-- Executar correção com a nova margem
SELECT auto_fix_perfume_prices() as final_fix;