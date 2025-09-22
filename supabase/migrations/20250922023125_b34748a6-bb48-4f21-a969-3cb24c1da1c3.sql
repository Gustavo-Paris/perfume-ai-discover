-- Criar função que força margem correta diretamente no preço
CREATE OR REPLACE FUNCTION public.force_correct_margin_pricing(
  perfume_uuid UUID,
  target_margin_multiplier NUMERIC DEFAULT 2.0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  perfume_cost NUMERIC;
  perfume_info RECORD;
  sizes INTEGER[] := ARRAY[2, 5, 10, 50];
  size_val INTEGER;
  total_cost_with_packaging NUMERIC;
  final_price NUMERIC;
  results JSONB := '[]'::jsonb;
  
  -- Custos de embalagem (buscar dos materiais ou usar padrão)
  packaging_costs RECORD;
BEGIN
  -- Buscar informações do perfume
  SELECT avg_cost_per_ml, name, brand INTO perfume_info
  FROM perfumes WHERE id = perfume_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfume não encontrado';
  END IF;
  
  perfume_cost := COALESCE(perfume_info.avg_cost_per_ml, 0);
  
  -- Buscar custos de embalagem reais
  SELECT 
    COALESCE(m2.cost_per_unit, 0.50) as frasco_2ml,
    COALESCE(m5.cost_per_unit, 0.80) as frasco_5ml,
    COALESCE(m10.cost_per_unit, 1.20) as frasco_10ml,
    COALESCE(m50.cost_per_unit, 3.00) as frasco_50ml,
    COALESCE(me.cost_per_unit, 0.15) as etiqueta
  INTO packaging_costs
  FROM (VALUES (1)) as dummy(x)
  LEFT JOIN materials m2 ON m2.name ILIKE '%2ml%' AND m2.is_active = true
  LEFT JOIN materials m5 ON m5.name ILIKE '%5ml%' AND m5.is_active = true  
  LEFT JOIN materials m10 ON m10.name ILIKE '%10ml%' AND m10.is_active = true
  LEFT JOIN materials m50 ON m50.name ILIKE '%50ml%' AND m50.is_active = true
  LEFT JOIN materials me ON me.name ILIKE '%etiqueta%' AND me.is_active = true
  LIMIT 1;
  
  -- Para cada tamanho
  FOREACH size_val IN ARRAY sizes
  LOOP
    -- Calcular custo total com embalagem
    total_cost_with_packaging := (perfume_cost * size_val) + 
      CASE size_val
        WHEN 2 THEN packaging_costs.frasco_2ml + packaging_costs.etiqueta
        WHEN 5 THEN packaging_costs.frasco_5ml + packaging_costs.etiqueta
        WHEN 10 THEN packaging_costs.frasco_10ml + packaging_costs.etiqueta
        WHEN 50 THEN packaging_costs.frasco_50ml + packaging_costs.etiqueta
        ELSE packaging_costs.frasco_10ml + packaging_costs.etiqueta
      END;
    
    -- Aplicar margem diretamente: preço = custo × margem
    final_price := ROUND(total_cost_with_packaging * target_margin_multiplier, 2);
    
    -- Atualizar preço na tabela
    IF size_val = 2 THEN
      UPDATE perfumes SET price_2ml = final_price WHERE id = perfume_uuid;
    ELSIF size_val = 5 THEN
      UPDATE perfumes SET price_5ml = final_price WHERE id = perfume_uuid;
    ELSIF size_val = 10 THEN
      UPDATE perfumes SET price_10ml = final_price WHERE id = perfume_uuid;
    ELSIF size_val = 50 THEN
      UPDATE perfumes SET price_full = final_price WHERE id = perfume_uuid;
    END IF;
    
    -- Adicionar ao resultado
    results := results || jsonb_build_array(
      jsonb_build_object(
        'size_ml', size_val,
        'total_cost', total_cost_with_packaging,
        'final_price', final_price,
        'effective_margin', CASE WHEN total_cost_with_packaging > 0 THEN final_price / total_cost_with_packaging ELSE 0 END
      )
    );
  END LOOP;
  
  -- Atualizar target_margin_percentage
  UPDATE perfumes 
  SET target_margin_percentage = target_margin_multiplier
  WHERE id = perfume_uuid;
  
  -- Log da operação
  INSERT INTO price_calculation_logs (
    perfume_id, action_type, trigger_source,
    old_prices, new_prices, execution_time_ms
  ) VALUES (
    perfume_uuid, 'force_margin_correction', 'direct_calculation',
    jsonb_build_object('perfume', perfume_info.name),
    jsonb_build_object('results', results, 'target_margin', target_margin_multiplier),
    0
  );
  
  RETURN jsonb_build_object(
    'perfume_id', perfume_uuid,
    'perfume_name', perfume_info.name,
    'brand', perfume_info.brand,
    'cost_per_ml', perfume_cost,
    'target_margin', target_margin_multiplier,
    'pricing_results', results
  );
END;
$$;