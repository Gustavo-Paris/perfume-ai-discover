-- Criar versão debug para ver onde está o erro
CREATE OR REPLACE FUNCTION public.recalculate_all_prices_debug()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  perfume_record RECORD;
  size_record INTEGER;
  perfume_cost NUMERIC;
  packaging_cost NUMERIC;
  total_cost NUMERIC;
  suggested_price NUMERIC;
  updated_count INTEGER := 0;
  error_count INTEGER := 0;
  error_details TEXT := '';
  
  -- Custos dos materiais
  frasco_2ml_cost NUMERIC := 0.50;
  frasco_5ml_cost NUMERIC := 0.80;
  frasco_10ml_cost NUMERIC := 1.20;
  frasco_50ml_cost NUMERIC := 15.00;
  etiqueta_cost NUMERIC := 0.15;
  
  available_sizes INTEGER[] := ARRAY[2, 5, 10, 50];
BEGIN
  -- Buscar custos reais dos materiais se existirem
  BEGIN
    SELECT COALESCE(cost_per_unit, 0.50) INTO frasco_2ml_cost 
    FROM materials WHERE name = 'Frasco 2ml' AND is_active = true LIMIT 1;
    
    SELECT COALESCE(cost_per_unit, 0.80) INTO frasco_5ml_cost 
    FROM materials WHERE name = 'Frasco 5ml' AND is_active = true LIMIT 1;
    
    SELECT COALESCE(cost_per_unit, 1.20) INTO frasco_10ml_cost 
    FROM materials WHERE name = 'Frasco 10ml' AND is_active = true LIMIT 1;
    
    SELECT COALESCE(cost_per_unit, 15.00) INTO frasco_50ml_cost 
    FROM materials WHERE name = 'Frasco 50ml' AND is_active = true LIMIT 1;
    
    SELECT COALESCE(cost_per_unit, 0.15) INTO etiqueta_cost 
    FROM materials WHERE name = 'Etiqueta Padrão' AND is_active = true LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Testar apenas um perfume primeiro
  SELECT id, name, COALESCE(avg_cost_per_ml, 0) as avg_cost_per_ml, 
         COALESCE(target_margin_percentage, 2.0) as margin_multiplier
  INTO perfume_record
  FROM perfumes
  LIMIT 1;
  
  BEGIN
    perfume_cost := perfume_record.avg_cost_per_ml;
    
    -- Testar apenas o tamanho 5ml
    size_record := 5;
    packaging_cost := frasco_5ml_cost + etiqueta_cost;
    total_cost := (perfume_cost * size_record) + packaging_cost;
    suggested_price := total_cost * perfume_record.margin_multiplier;
    suggested_price := ROUND(suggested_price, 2);
    
    -- Tentar atualizar
    INSERT INTO perfume_prices (perfume_id, size_ml, price)
    VALUES (perfume_record.id, size_record, suggested_price)
    ON CONFLICT (perfume_id, size_ml)
    DO UPDATE SET 
      price = suggested_price,
      updated_at = now();
    
    updated_count := 1;
    
  EXCEPTION WHEN OTHERS THEN
    error_count := 1;
    error_details := SQLERRM;
  END;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_perfumes', updated_count,
    'errors', error_count,
    'error_details', error_details,
    'perfume_tested', perfume_record.name,
    'perfume_cost', perfume_cost,
    'packaging_cost', packaging_cost,
    'total_cost', total_cost,
    'suggested_price', suggested_price,
    'margin_multiplier', perfume_record.margin_multiplier
  );
END;
$$;