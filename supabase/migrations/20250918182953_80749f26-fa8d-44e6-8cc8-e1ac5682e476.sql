-- Corrigir a função update_perfume_margin para usar cálculo direto
CREATE OR REPLACE FUNCTION public.update_perfume_margin(perfume_uuid uuid, new_margin_percentage numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result_data jsonb;
  available_sizes integer[] := ARRAY[2, 5, 10, 20];
  size_record integer;
  perfume_cost NUMERIC;
  packaging_cost NUMERIC;
  total_cost NUMERIC;
  suggested_price NUMERIC;
  
  -- Custos dos materiais
  frasco_2ml_cost NUMERIC := 0.50;
  frasco_5ml_cost NUMERIC := 0.80;
  frasco_10ml_cost NUMERIC := 1.20;
  etiqueta_cost NUMERIC := 0.15;
  perfume_info RECORD;
BEGIN
  -- Buscar informações do perfume
  SELECT avg_cost_per_ml INTO perfume_info
  FROM perfumes 
  WHERE id = perfume_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfume não encontrado: %', perfume_uuid;
  END IF;
  
  -- Atualizar margem do perfume
  UPDATE perfumes 
  SET target_margin_percentage = new_margin_percentage
  WHERE id = perfume_uuid;
  
  -- Buscar custos reais dos materiais se existirem
  BEGIN
    SELECT COALESCE(cost_per_unit, 0.50) INTO frasco_2ml_cost 
    FROM materials WHERE name = 'Frasco 2ml' AND is_active = true LIMIT 1;
    
    SELECT COALESCE(cost_per_unit, 0.80) INTO frasco_5ml_cost 
    FROM materials WHERE name = 'Frasco 5ml' AND is_active = true LIMIT 1;
    
    SELECT COALESCE(cost_per_unit, 1.20) INTO frasco_10ml_cost 
    FROM materials WHERE name = 'Frasco 10ml' AND is_active = true LIMIT 1;
    
    SELECT COALESCE(cost_per_unit, 0.15) INTO etiqueta_cost 
    FROM materials WHERE name = 'Etiqueta Padrão' AND is_active = true LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Recalcular preços para todos os tamanhos padrão
  FOR size_record IN SELECT unnest(available_sizes)
  LOOP
    -- Determinar custo da embalagem baseado no tamanho
    IF size_record = 2 THEN
      packaging_cost := frasco_2ml_cost + etiqueta_cost;
    ELSIF size_record = 5 THEN
      packaging_cost := frasco_5ml_cost + etiqueta_cost;
    ELSIF size_record = 10 THEN
      packaging_cost := frasco_10ml_cost + etiqueta_cost;
    ELSIF size_record = 20 THEN
      packaging_cost := frasco_10ml_cost + etiqueta_cost;
    ELSE
      packaging_cost := frasco_10ml_cost + etiqueta_cost;
    END IF;
    
    -- Calcular custo total: (perfume por ml * quantidade) + embalagem
    perfume_cost := COALESCE(perfume_info.avg_cost_per_ml, 0);
    total_cost := (perfume_cost * size_record) + packaging_cost;
    
    -- Aplicar margem - CORREÇÃO: usar diretamente o multiplicador
    suggested_price := total_cost * new_margin_percentage;
    
    -- Arredondar para 2 casas decimais
    suggested_price := ROUND(suggested_price, 2);
    
    -- Salvar preço na tabela perfume_prices
    INSERT INTO perfume_prices (perfume_id, size_ml, price)
    VALUES (perfume_uuid, size_record, suggested_price)
    ON CONFLICT (perfume_id, size_ml)
    DO UPDATE SET 
      price = suggested_price,
      updated_at = now();
  END LOOP;
  
  -- Retornar informações de sucesso
  result_data := jsonb_build_object(
    'success', true,
    'perfume_id', perfume_uuid,
    'new_margin', new_margin_percentage,
    'updated_sizes', available_sizes,
    'message', 'Margem atualizada e preços recalculados com sucesso'
  );
  
  RETURN result_data;
END;
$function$;