-- Corrigir a função recalculate_all_prices para incluir todos os tamanhos
CREATE OR REPLACE FUNCTION public.recalculate_all_prices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  perfume_record RECORD;
  cost_result RECORD;
BEGIN
  -- Para cada perfume, recalcular preços para todos os tamanhos
  FOR perfume_record IN SELECT id, category FROM perfumes LOOP
    
    -- Calcular preço para 2ml (só para Ultra Luxury)
    IF perfume_record.category = 'Ultra Luxury' THEN
      SELECT * INTO cost_result 
      FROM calculate_product_total_cost(perfume_record.id, 2);
      
      UPDATE perfumes 
      SET price_2ml = cost_result.suggested_price
      WHERE id = perfume_record.id;
    END IF;
    
    -- Calcular preço para 5ml
    SELECT * INTO cost_result 
    FROM calculate_product_total_cost(perfume_record.id, 5);
    
    UPDATE perfumes 
    SET price_5ml = cost_result.suggested_price
    WHERE id = perfume_record.id;
    
    -- Calcular preço para 10ml
    SELECT * INTO cost_result 
    FROM calculate_product_total_cost(perfume_record.id, 10);
    
    UPDATE perfumes 
    SET price_10ml = cost_result.suggested_price
    WHERE id = perfume_record.id;
    
    -- Calcular preço para 50ml
    SELECT * INTO cost_result 
    FROM calculate_product_total_cost(perfume_record.id, 50);
    
    UPDATE perfumes 
    SET price_full = cost_result.suggested_price
    WHERE id = perfume_record.id;
    
  END LOOP;
END;
$$;