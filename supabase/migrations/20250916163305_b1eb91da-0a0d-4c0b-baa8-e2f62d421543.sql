-- Drop existing function and recreate it properly
DROP FUNCTION IF EXISTS public.update_perfume_margin(uuid, numeric);

-- Create function to update perfume margin and recalculate prices
CREATE OR REPLACE FUNCTION public.update_perfume_margin(
  perfume_uuid uuid,
  new_margin_percentage numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cost_result_2ml RECORD;
  cost_result_5ml RECORD;
  cost_result_10ml RECORD;
  cost_result_50ml RECORD;
BEGIN
  -- Update the target margin percentage
  UPDATE perfumes 
  SET target_margin_percentage = new_margin_percentage
  WHERE id = perfume_uuid;
  
  -- Recalculate prices for all sizes
  
  -- 2ml (only for Ultra Luxury)
  SELECT * INTO cost_result_2ml 
  FROM calculate_product_total_cost(perfume_uuid, 2);
  
  -- 5ml
  SELECT * INTO cost_result_5ml 
  FROM calculate_product_total_cost(perfume_uuid, 5);
  
  -- 10ml
  SELECT * INTO cost_result_10ml 
  FROM calculate_product_total_cost(perfume_uuid, 10);
  
  -- 50ml
  SELECT * INTO cost_result_50ml 
  FROM calculate_product_total_cost(perfume_uuid, 50);
  
  -- Update perfume prices
  UPDATE perfumes 
  SET 
    price_2ml = cost_result_2ml.suggested_price,
    price_5ml = cost_result_5ml.suggested_price,
    price_10ml = cost_result_10ml.suggested_price,
    price_full = cost_result_50ml.suggested_price
  WHERE id = perfume_uuid;
END;
$function$;