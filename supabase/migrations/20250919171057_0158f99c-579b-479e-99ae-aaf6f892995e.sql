-- Fix security warnings by setting search_path for functions that need it
-- Update functions to have explicit search_path

-- Fix calculate_product_total_cost function if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_product_total_cost') THEN
    ALTER FUNCTION public.calculate_product_total_cost SET search_path = public;
  END IF;
END
$$;

-- Fix has_role function if it exists  
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') THEN
    ALTER FUNCTION public.has_role SET search_path = public;
  END IF;
END
$$;