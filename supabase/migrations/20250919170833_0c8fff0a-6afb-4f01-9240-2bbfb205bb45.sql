-- Fix function search path security issue
-- Update functions to have explicit search_path setting for security

-- Fix the update_perfume_avg_cost function
CREATE OR REPLACE FUNCTION public.update_perfume_avg_cost(perfume_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  total_ml_cost numeric := 0;
  total_ml numeric := 0;
  new_avg_cost numeric := 0;
BEGIN
  -- Calculate weighted average cost from all lots
  SELECT 
    COALESCE(SUM(qty_ml * cost_per_ml), 0),
    COALESCE(SUM(qty_ml), 0)
  INTO total_ml_cost, total_ml
  FROM inventory_lots 
  WHERE perfume_id = perfume_uuid;
  
  -- Calculate new average cost
  IF total_ml > 0 THEN
    new_avg_cost := total_ml_cost / total_ml;
  END IF;
  
  -- Update perfume with new average cost
  UPDATE perfumes 
  SET 
    avg_cost_per_ml = new_avg_cost,
    last_cost_calculation = now()
  WHERE id = perfume_uuid;
END;
$function$;

-- Fix the detect_material_info function
CREATE OR REPLACE FUNCTION public.detect_material_info(material_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  detected_info jsonb := '{}';
  size_match text;
  size_value integer;
  material_type text;
BEGIN
  -- Detectar tamanho em ml
  size_match := (regexp_matches(lower(material_name), '(\d+)\s*ml', 'i'))[1];
  IF size_match IS NOT NULL THEN
    size_value := size_match::integer;
    detected_info := jsonb_set(detected_info, '{size_ml}', to_jsonb(size_value));
  END IF;
  
  -- Detectar tipo de material
  IF lower(material_name) ~* '(frasco|vidro|recipiente|bottle)' THEN
    material_type := 'frasco';
  ELSIF lower(material_name) ~* '(etiqueta|label|adesiv)' THEN
    material_type := 'etiqueta';
  ELSIF lower(material_name) ~* '(caixa|box|embalag)' THEN
    material_type := 'caixa';
  ELSIF lower(material_name) ~* '(tampa|cap)' THEN
    material_type := 'tampa';
  ELSE
    material_type := 'outro';
  END IF;
  
  detected_info := jsonb_set(detected_info, '{detected_type}', to_jsonb(material_type));
  
  -- Determinar se afeta preço
  detected_info := jsonb_set(detected_info, '{affects_pricing}', 
    to_jsonb(material_type IN ('frasco', 'etiqueta')));
  
  RETURN detected_info;
END;
$function$;