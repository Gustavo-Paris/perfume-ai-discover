-- Fix the ambiguous column reference in generate_order_number function
CREATE OR REPLACE FUNCTION public.generate_order_number()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
  order_number_result TEXT;
BEGIN
  -- Get the next number based on existing orders (fully qualify column to avoid ambiguity)
  SELECT COALESCE(MAX(CAST(SUBSTRING(o.order_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.orders o
  WHERE o.order_number ~ '^PC[0-9]+$';
  
  -- Format as PC + 6 digits
  order_number_result := 'PC' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN order_number_result;
END;
$function$;

-- Remove duplicate trigger (keep the more descriptive named one)
DROP TRIGGER IF EXISTS trigger_set_order_number ON public.orders;