-- Corrigir todas as funções removendo updated_at que não existe
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
  
  -- Atualizar perfume (SEM updated_at)
  UPDATE perfumes 
  SET avg_cost_per_ml = avg_cost
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

-- Simplificar função de verificação diária removendo notificações problemáticas
CREATE OR REPLACE FUNCTION public.daily_price_integrity_check()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  integrity_issues INTEGER;
  auto_fix_result JSONB;
BEGIN
  -- Contar problemas de integridade
  SELECT COUNT(*) INTO integrity_issues
  FROM check_price_integrity();
  
  -- Se houver problemas, tentar correção automática
  IF integrity_issues > 0 THEN
    SELECT auto_fix_perfume_prices() INTO auto_fix_result;
    
    -- Retornar resultado sem enviar notificações (que estavam causando erro)
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

-- Testar a correção automática agora
SELECT auto_fix_perfume_prices() as test_result;