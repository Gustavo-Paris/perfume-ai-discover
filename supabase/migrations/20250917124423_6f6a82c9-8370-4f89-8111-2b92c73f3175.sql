-- Criar tabela para preços dinâmicos dos perfumes
CREATE TABLE public.perfume_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  perfume_id UUID NOT NULL REFERENCES public.perfumes(id) ON DELETE CASCADE,
  size_ml INTEGER NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Garantir que não haja duplicatas de tamanho por perfume
  UNIQUE(perfume_id, size_ml)
);

-- Enable RLS
ALTER TABLE public.perfume_prices ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para perfume_prices
CREATE POLICY "Anyone can view perfume prices" 
ON public.perfume_prices 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage perfume prices" 
ON public.perfume_prices 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_perfume_prices_updated_at
  BEFORE UPDATE ON public.perfume_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrar dados existentes das colunas hardcoded para a nova tabela
INSERT INTO public.perfume_prices (perfume_id, size_ml, price)
SELECT id, 2, price_2ml 
FROM public.perfumes 
WHERE price_2ml IS NOT NULL AND price_2ml > 0;

INSERT INTO public.perfume_prices (perfume_id, size_ml, price)
SELECT id, 5, price_5ml 
FROM public.perfumes 
WHERE price_5ml IS NOT NULL AND price_5ml > 0;

INSERT INTO public.perfume_prices (perfume_id, size_ml, price)
SELECT id, 10, price_10ml 
FROM public.perfumes 
WHERE price_10ml IS NOT NULL AND price_10ml > 0;

-- Função para obter preços dinâmicos de um perfume
CREATE OR REPLACE FUNCTION public.get_perfume_dynamic_prices(perfume_uuid uuid)
RETURNS TABLE(size_ml integer, price numeric)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT pp.size_ml, pp.price
  FROM public.perfume_prices pp
  WHERE pp.perfume_id = perfume_uuid
  ORDER BY pp.size_ml;
$function$;

-- Função para definir preço dinâmico
CREATE OR REPLACE FUNCTION public.set_perfume_price(perfume_uuid uuid, size_ml_param integer, price_param numeric)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  price_id uuid;
BEGIN
  INSERT INTO public.perfume_prices (perfume_id, size_ml, price)
  VALUES (perfume_uuid, size_ml_param, price_param)
  ON CONFLICT (perfume_id, size_ml)
  DO UPDATE SET 
    price = price_param,
    updated_at = now()
  RETURNING id INTO price_id;
  
  RETURN price_id;
END;
$function$;

-- Função atualizada para calcular preços com materiais (versão dinâmica)
CREATE OR REPLACE FUNCTION public.calculate_dynamic_product_costs(perfume_uuid uuid, sizes_array integer[])
RETURNS TABLE(size_ml integer, perfume_cost_per_unit numeric, materials_cost_per_unit numeric, total_cost_per_unit numeric, suggested_price numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  size_ml_param integer;
  perfume_cost numeric := 0;
  materials_cost numeric := 0;
  margin_percentage numeric := 0.50;
BEGIN
  -- Get perfume cost per ml and margin
  SELECT 
    COALESCE(p.avg_cost_per_ml, 0),
    COALESCE(p.target_margin_percentage, 0.50)
  INTO perfume_cost, margin_percentage
  FROM perfumes p 
  WHERE p.id = perfume_uuid;
  
  -- Loop through each size
  FOREACH size_ml_param IN ARRAY sizes_array
  LOOP
    -- Calculate materials cost for this specific size
    SELECT COALESCE(SUM(m.cost_per_unit * pr.quantity_needed), 0)
    INTO materials_cost
    FROM product_recipes pr
    JOIN materials m ON pr.material_id = m.id
    WHERE pr.perfume_id = perfume_uuid 
      AND pr.size_ml = size_ml_param
      AND m.type = 'input'
      AND m.is_active = true;
    
    -- Return row for this size
    RETURN QUERY SELECT 
      size_ml_param as size_ml,
      (perfume_cost * size_ml_param) as perfume_cost_per_unit,
      materials_cost as materials_cost_per_unit,
      ((perfume_cost * size_ml_param) + materials_cost) as total_cost_per_unit,
      ROUND(((perfume_cost * size_ml_param) + materials_cost) / (1 - margin_percentage), 2) as suggested_price;
  END LOOP;
END;
$function$;