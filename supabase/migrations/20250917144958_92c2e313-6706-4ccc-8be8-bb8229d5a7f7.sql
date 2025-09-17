-- Criar função para recalcular todos os preços com o novo sistema
CREATE OR REPLACE FUNCTION public.recalculate_all_perfume_prices()
RETURNS TABLE(perfume_id uuid, updated_sizes integer[], message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  perfume_record RECORD;
  available_sizes integer[];
  size_record integer;
  price_result RECORD;
  updated_count integer := 0;
BEGIN
  -- Buscar tamanhos disponíveis das configurações de materiais
  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT (jsonb_array_elements_text(bottle_materials)::jsonb->>'size_ml')::integer
      FROM material_configurations 
      WHERE bottle_materials IS NOT NULL 
        AND jsonb_array_length(bottle_materials) > 0
    ), 
    ARRAY[5, 10, 50] -- fallback padrão
  ) INTO available_sizes;
  
  -- Para cada perfume, recalcular preços
  FOR perfume_record IN 
    SELECT p.id, p.name, p.brand, p.target_margin 
    FROM perfumes p 
  LOOP
    -- Para cada tamanho disponível
    FOR size_record IN SELECT unnest(available_sizes)
    LOOP
      -- Calcular novo custo e preço com margem corrigida
      SELECT * INTO price_result 
      FROM calculate_product_total_cost(perfume_record.id, size_record);
      
      -- Definir preço calculado se válido
      IF price_result.suggested_price IS NOT NULL AND price_result.suggested_price > 0 THEN
        PERFORM set_perfume_price(perfume_record.id, size_record, price_result.suggested_price);
      END IF;
    END LOOP;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN QUERY SELECT 
    null::uuid as perfume_id,
    available_sizes as updated_sizes,
    format('Recalculados preços para %s perfumes em %s tamanhos', updated_count, array_length(available_sizes, 1)) as message;
END;
$function$;