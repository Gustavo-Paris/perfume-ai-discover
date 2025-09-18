-- DROP da função existente para poder alterar o tipo de retorno
DROP FUNCTION IF EXISTS public.recalculate_all_perfume_prices();

-- Criar nova função com cálculo correto
CREATE OR REPLACE FUNCTION public.recalculate_all_perfume_prices()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  perfume_record RECORD;
  size_record RECORD;
  perfume_cost NUMERIC;
  packaging_cost NUMERIC;
  total_cost NUMERIC;
  suggested_price NUMERIC;
  updated_count INTEGER := 0;
  
  -- Custos dos materiais
  frasco_2ml_cost NUMERIC := 0.50;
  frasco_5ml_cost NUMERIC := 0.80;
  frasco_10ml_cost NUMERIC := 1.20;
  etiqueta_cost NUMERIC := 0.15;
BEGIN
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
    -- Se houver erro na busca de materiais, usar valores padrão
    NULL;
  END;

  -- Para cada perfume
  FOR perfume_record IN 
    SELECT id, target_margin_percentage, avg_cost_per_ml, name
    FROM perfumes
    WHERE target_margin_percentage > 0
  LOOP
    -- Para cada tamanho padrão
    FOR size_record IN
      SELECT size_ml FROM (VALUES (2), (5), (10), (20)) AS sizes(size_ml)
    LOOP
      -- Determinar custo da embalagem baseado no tamanho
      IF size_record.size_ml = 2 THEN
        packaging_cost := frasco_2ml_cost + etiqueta_cost;
      ELSIF size_record.size_ml = 5 THEN
        packaging_cost := frasco_5ml_cost + etiqueta_cost;
      ELSIF size_record.size_ml = 10 THEN
        packaging_cost := frasco_10ml_cost + etiqueta_cost;
      ELSIF size_record.size_ml = 20 THEN
        packaging_cost := frasco_10ml_cost + etiqueta_cost; -- Usar frasco 10ml para 20ml
      ELSE
        packaging_cost := frasco_10ml_cost + etiqueta_cost;
      END IF;
      
      -- Calcular custo total: (perfume por ml * quantidade) + embalagem
      perfume_cost := COALESCE(perfume_record.avg_cost_per_ml, 0);
      total_cost := (perfume_cost * size_record.size_ml) + packaging_cost;
      
      -- Aplicar margem - CORRIGIDO: usar diretamente o multiplicador
      suggested_price := total_cost * COALESCE(perfume_record.target_margin_percentage, 2.0);
      
      -- Arredondar para 2 casas decimais
      suggested_price := ROUND(suggested_price, 2);
      
      -- Inserir/atualizar na tabela perfume_prices
      INSERT INTO perfume_prices (perfume_id, size_ml, price)
      VALUES (perfume_record.id, size_record.size_ml, suggested_price)
      ON CONFLICT (perfume_id, size_ml)
      DO UPDATE SET 
        price = suggested_price,
        updated_at = now();
        
      updated_count := updated_count + 1;
    END LOOP;
  END LOOP;
  
  RETURN jsonb_build_object(
    'message', format('Preços recalculados para %s entradas', updated_count),
    'updated_count', updated_count
  );
END;
$function$;