-- Dropar e recriar a função recalculate_all_prices com a lógica correta
DROP FUNCTION IF EXISTS public.recalculate_all_prices();

CREATE OR REPLACE FUNCTION public.recalculate_all_prices()
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
  
  -- Custos dos materiais (mesmos valores da update_perfume_margin)
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
  
  -- Para cada perfume
  FOR perfume_record IN 
    SELECT id, name, COALESCE(avg_cost_per_ml, 0) as avg_cost_per_ml, 
           COALESCE(target_margin_percentage, 2.0) as margin_multiplier
    FROM perfumes
    ORDER BY name
  LOOP
    BEGIN
      perfume_cost := perfume_record.avg_cost_per_ml;
      
      -- Para cada tamanho
      FOREACH size_record IN ARRAY available_sizes
      LOOP
        -- Determinar custo da embalagem baseado no tamanho
        IF size_record = 2 THEN
          packaging_cost := frasco_2ml_cost + etiqueta_cost;
        ELSIF size_record = 5 THEN
          packaging_cost := frasco_5ml_cost + etiqueta_cost;
        ELSIF size_record = 10 THEN
          packaging_cost := frasco_10ml_cost + etiqueta_cost;
        ELSIF size_record = 50 THEN
          packaging_cost := frasco_50ml_cost + etiqueta_cost;
        ELSE
          packaging_cost := frasco_10ml_cost + etiqueta_cost; -- Default
        END IF;
        
        -- Calcular custo total: (perfume por ml * quantidade) + embalagem
        total_cost := (perfume_cost * size_record) + packaging_cost;
        
        -- Aplicar margem (margin_multiplier já é o multiplicador, não percentual)
        suggested_price := total_cost * perfume_record.margin_multiplier;
        
        -- Arredondar para 2 casas decimais
        suggested_price := ROUND(suggested_price, 2);
        
        -- Atualizar na tabela perfume_prices
        INSERT INTO perfume_prices (perfume_id, size_ml, price)
        VALUES (perfume_record.id, size_record, suggested_price)
        ON CONFLICT (perfume_id, size_ml)
        DO UPDATE SET 
          price = suggested_price,
          updated_at = now();
        
        -- Atualizar também as colunas legadas na tabela perfumes
        IF size_record = 2 THEN
          UPDATE perfumes 
          SET price_2ml = suggested_price
          WHERE id = perfume_record.id;
        ELSIF size_record = 5 THEN
          UPDATE perfumes 
          SET price_5ml = suggested_price
          WHERE id = perfume_record.id;
        ELSIF size_record = 10 THEN
          UPDATE perfumes 
          SET price_10ml = suggested_price
          WHERE id = perfume_record.id;
        ELSIF size_record = 50 THEN
          UPDATE perfumes 
          SET price_full = suggested_price
          WHERE id = perfume_record.id;
        END IF;
      END LOOP;
      
      updated_count := updated_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE LOG 'Erro ao recalcular perfume %: %', perfume_record.name, SQLERRM;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_perfumes', updated_count,
    'errors', error_count,
    'message', format('Preços recalculados para %s perfumes (erros: %s)', updated_count, error_count)
  );
END;
$$;