-- ===============================================
-- PLANO DE CORREÇÃO DOS PREÇOS DOS PERFUMES
-- ===============================================

-- 1. REMOVER TRIGGERS CONFLITANTES
DROP TRIGGER IF EXISTS auto_recalculate_perfume_prices_trigger ON material_lots;
DROP TRIGGER IF EXISTS trigger_price_recalculation_materials ON materials;
DROP TRIGGER IF EXISTS trigger_price_recalculation_lots ON inventory_lots;

-- 2. CRIAR TABELA DE LOG PARA MONITORAMENTO
CREATE TABLE IF NOT EXISTS public.price_calculation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  perfume_id UUID,
  action_type TEXT NOT NULL, -- 'auto_trigger', 'manual_fix', 'batch_recalc', 'integrity_check'
  trigger_source TEXT, -- 'inventory_lots', 'materials', 'manual', 'scheduled'
  old_prices JSONB,
  new_prices JSONB,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID DEFAULT auth.uid()
);

-- RLS para a tabela de logs
ALTER TABLE public.price_calculation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage price logs" ON public.price_calculation_logs FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. CRIAR FUNÇÃO SEGURA DE ATUALIZAÇÃO DE CUSTO MÉDIO
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

-- 4. CRIAR FUNÇÃO DE VERIFICAÇÃO DE INTEGRIDADE DOS PREÇOS
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

-- 5. CRIAR FUNÇÃO DE RECUPERAÇÃO AUTOMÁTICA
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
BEGIN
  -- Log início da operação
  INSERT INTO price_calculation_logs (action_type, trigger_source)
  VALUES ('batch_auto_fix', 'scheduled_check');
  
  -- Para cada perfume com problema
  FOR perfume_record IN 
    SELECT perfume_id, issue_type FROM check_price_integrity()
    WHERE issue_type IN ('zero_prices', 'zero_cost')
  LOOP
    BEGIN
      -- Primeiro, atualizar custo médio
      PERFORM update_perfume_avg_cost_safe(perfume_record.perfume_id);
      
      -- Depois, recalcular preços usando a função existente
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
    'timestamp', now()
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

-- 6. CRIAR FUNÇÃO HELPER PARA RECALCULAR PREÇOS POR TAMANHOS
CREATE OR REPLACE FUNCTION public.recalculate_perfume_prices_for_sizes(
  perfume_uuid UUID,
  sizes INTEGER[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  size_val INTEGER;
  cost_result RECORD;
  old_prices JSONB;
  new_prices JSONB;
  start_time TIMESTAMP := clock_timestamp();
BEGIN
  -- Capturar preços atuais para log
  SELECT jsonb_build_object(
    'price_2ml', price_2ml,
    'price_5ml', price_5ml, 
    'price_10ml', price_10ml,
    'price_full', price_full
  ) INTO old_prices
  FROM perfumes WHERE id = perfume_uuid;
  
  -- Para cada tamanho
  FOREACH size_val IN ARRAY sizes
  LOOP
    -- Calcular custo total para este tamanho
    SELECT * INTO cost_result 
    FROM calculate_product_total_cost(perfume_uuid, size_val);
    
    -- Atualizar preço baseado no tamanho
    IF size_val = 2 THEN
      UPDATE perfumes SET price_2ml = cost_result.suggested_price WHERE id = perfume_uuid;
    ELSIF size_val = 5 THEN
      UPDATE perfumes SET price_5ml = cost_result.suggested_price WHERE id = perfume_uuid;
    ELSIF size_val = 10 THEN
      UPDATE perfumes SET price_10ml = cost_result.suggested_price WHERE id = perfume_uuid;
    ELSIF size_val = 50 THEN
      UPDATE perfumes SET price_full = cost_result.suggested_price WHERE id = perfume_uuid;
    END IF;
  END LOOP;
  
  -- Capturar novos preços para log
  SELECT jsonb_build_object(
    'price_2ml', price_2ml,
    'price_5ml', price_5ml, 
    'price_10ml', price_10ml,
    'price_full', price_full
  ) INTO new_prices
  FROM perfumes WHERE id = perfume_uuid;
  
  -- Log da operação
  INSERT INTO price_calculation_logs (
    perfume_id, action_type, trigger_source, old_prices, new_prices,
    execution_time_ms
  ) VALUES (
    perfume_uuid, 'price_recalculation', 'manual_sizes',
    old_prices, new_prices,
    EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) * 1000
  );
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO price_calculation_logs (
    perfume_id, action_type, trigger_source, error_message
  ) VALUES (
    perfume_uuid, 'price_recalculation_error', 'manual_sizes', SQLERRM
  );
  
  RETURN FALSE;
END;
$$;

-- 7. CRIAR TRIGGER ÚNICO E SEGURO PARA INVENTORY_LOTS
CREATE OR REPLACE FUNCTION public.safe_inventory_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_perfume_id UUID;
BEGIN
  -- Determinar qual perfume foi afetado
  affected_perfume_id := COALESCE(NEW.perfume_id, OLD.perfume_id);
  
  -- Só processar se realmente houver mudança significativa
  IF TG_OP = 'INSERT' OR 
     (TG_OP = 'UPDATE' AND (NEW.qty_ml != OLD.qty_ml OR NEW.cost_per_ml != OLD.cost_per_ml)) OR
     TG_OP = 'DELETE' THEN
    
    -- Usar função segura para atualizar custo médio
    PERFORM update_perfume_avg_cost_safe(affected_perfume_id);
    
    -- Agendar recálculo de preços (usando função segura)
    PERFORM recalculate_perfume_prices_for_sizes(
      affected_perfume_id, 
      ARRAY[2, 5, 10, 50]
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, apenas log - não falhar a transação principal
  INSERT INTO price_calculation_logs (
    perfume_id, action_type, trigger_source, error_message
  ) VALUES (
    affected_perfume_id, 'trigger_error', 'inventory_lots_trigger', SQLERRM
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Criar o trigger seguro
CREATE TRIGGER safe_inventory_lots_trigger
  AFTER INSERT OR UPDATE OR DELETE ON inventory_lots
  FOR EACH ROW EXECUTE FUNCTION safe_inventory_trigger();

-- 8. CRIAR FUNÇÃO DE VERIFICAÇÃO DIÁRIA (para usar com cron)
CREATE OR REPLACE FUNCTION public.daily_price_integrity_check()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  integrity_issues INTEGER;
  auto_fix_result JSONB;
  admin_user_id UUID;
BEGIN
  -- Contar problemas de integridade
  SELECT COUNT(*) INTO integrity_issues
  FROM check_price_integrity();
  
  -- Se houver problemas, tentar correção automática
  IF integrity_issues > 0 THEN
    SELECT auto_fix_perfume_prices() INTO auto_fix_result;
    
    -- Notificar admins se necessário
    IF (auto_fix_result->>'error_count')::INTEGER > 0 THEN
      FOR admin_user_id IN 
        SELECT ur.user_id FROM user_roles ur WHERE ur.role = 'admin'::app_role
      LOOP
        INSERT INTO notifications (type, message, user_id, metadata)
        VALUES (
          'price_integrity_alert',
          format('Problemas detectados no sistema de preços: %s erros durante correção automática', 
                 auto_fix_result->>'error_count'),
          admin_user_id,
          jsonb_build_object(
            'integrity_issues', integrity_issues,
            'auto_fix_result', auto_fix_result,
            'check_timestamp', now()
          )
        );
      END LOOP;
    END IF;
    
    RETURN jsonb_build_object(
      'integrity_issues_found', integrity_issues,
      'auto_fix_executed', true,
      'auto_fix_result', auto_fix_result
    );
  ELSE
    RETURN jsonb_build_object(
      'integrity_issues_found', 0,
      'auto_fix_executed', false,
      'status', 'all_prices_ok'
    );
  END IF;
END;
$$;

-- 9. EXECUTAR VERIFICAÇÃO INICIAL E CORREÇÃO
SELECT auto_fix_perfume_prices() as initial_fix_result;