-- Criar tabela para configurações de materiais
CREATE TABLE public.material_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bottle_materials JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array com {size_ml, material_id, material_name}
  default_label_id UUID,
  default_label_name TEXT,
  auto_detect_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.material_configurations ENABLE ROW LEVEL SECURITY;

-- Política para admins gerenciarem configurações
CREATE POLICY "Admins can manage material configurations" 
ON public.material_configurations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Função para atualizar updated_at
CREATE TRIGGER update_material_configurations_updated_at
BEFORE UPDATE ON public.material_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para detectar informações do material baseado no nome
CREATE OR REPLACE FUNCTION public.detect_material_info(material_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Função para recalcular preços quando materiais mudarem
CREATE OR REPLACE FUNCTION public.update_perfume_margin(perfume_uuid uuid, new_margin_percentage numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cost_result RECORD;
BEGIN
  -- Atualizar margem do perfume
  UPDATE perfumes 
  SET target_margin_percentage = new_margin_percentage / 100.0
  WHERE id = perfume_uuid;
  
  -- Recalcular preços para todos os tamanhos
  -- 2ml (Ultra Luxury apenas)
  IF EXISTS (SELECT 1 FROM perfumes WHERE id = perfume_uuid AND category = 'Ultra Luxury') THEN
    SELECT * INTO cost_result FROM calculate_product_total_cost(perfume_uuid, 2);
    UPDATE perfumes SET price_2ml = cost_result.suggested_price WHERE id = perfume_uuid;
  END IF;
  
  -- 5ml
  SELECT * INTO cost_result FROM calculate_product_total_cost(perfume_uuid, 5);
  UPDATE perfumes SET price_5ml = cost_result.suggested_price WHERE id = perfume_uuid;
  
  -- 10ml
  SELECT * INTO cost_result FROM calculate_product_total_cost(perfume_uuid, 10);
  UPDATE perfumes SET price_10ml = cost_result.suggested_price WHERE id = perfume_uuid;
  
  -- 50ml
  SELECT * INTO cost_result FROM calculate_product_total_cost(perfume_uuid, 50);
  UPDATE perfumes SET price_full = cost_result.suggested_price WHERE id = perfume_uuid;
END;
$function$;