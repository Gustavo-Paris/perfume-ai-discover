-- Create materials table for tracking both inputs and assets
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('input', 'asset')), -- input: consumable materials, asset: company equipment
  category TEXT NOT NULL, -- 'packaging', 'fragrance', 'tools', etc.
  unit TEXT NOT NULL, -- 'pieces', 'ml', 'kg', etc.
  cost_per_unit NUMERIC NOT NULL DEFAULT 0,
  current_stock NUMERIC NOT NULL DEFAULT 0,
  min_stock_alert NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create material lots for tracking purchases
CREATE TABLE public.material_lots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  cost_per_unit NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  supplier TEXT,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiry_date DATE,
  lot_code TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create packaging rules table for intelligent packaging calculation
CREATE TABLE public.packaging_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  container_material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  max_items INTEGER NOT NULL, -- how many items fit in this container
  item_size_ml INTEGER, -- specific size this rule applies to (null = all sizes)
  priority INTEGER NOT NULL DEFAULT 1, -- for multiple rules, lower number = higher priority
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product recipes for cost calculation
CREATE TABLE public.product_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  perfume_id UUID NOT NULL REFERENCES public.perfumes(id) ON DELETE CASCADE,
  size_ml INTEGER NOT NULL,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  quantity_needed NUMERIC NOT NULL, -- how much of this material is needed per unit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(perfume_id, size_ml, material_id)
);

-- Add cost tracking fields to inventory_lots
ALTER TABLE public.inventory_lots 
ADD COLUMN cost_per_ml NUMERIC DEFAULT 0,
ADD COLUMN total_cost NUMERIC DEFAULT 0,
ADD COLUMN supplier TEXT;

-- Add cost management fields to perfumes
ALTER TABLE public.perfumes 
ADD COLUMN avg_cost_per_ml NUMERIC DEFAULT 0,
ADD COLUMN target_margin_percentage NUMERIC DEFAULT 0.50, -- 50% default margin
ADD COLUMN last_cost_calculation TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Enable RLS on new tables
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_recipes ENABLE ROW LEVEL SECURITY;

-- RLS policies for materials
CREATE POLICY "Admins can manage materials" 
ON public.materials FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for material_lots
CREATE POLICY "Admins can manage material lots" 
ON public.material_lots FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for packaging_rules
CREATE POLICY "Admins can manage packaging rules" 
ON public.packaging_rules FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active packaging rules" 
ON public.packaging_rules FOR SELECT 
USING (is_active = true);

-- RLS policies for product_recipes
CREATE POLICY "Admins can manage product recipes" 
ON public.product_recipes FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view product recipes" 
ON public.product_recipes FOR SELECT 
USING (true);

-- Create function to calculate weighted average cost for perfumes
CREATE OR REPLACE FUNCTION public.update_perfume_avg_cost(perfume_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- Create function to calculate total product cost including materials
CREATE OR REPLACE FUNCTION public.calculate_product_total_cost(perfume_uuid uuid, size_ml_param integer)
RETURNS TABLE(
  perfume_cost_per_unit numeric,
  materials_cost_per_unit numeric,
  total_cost_per_unit numeric,
  suggested_price numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  perfume_cost numeric := 0;
  materials_cost numeric := 0;
  margin_percentage numeric := 0.50;
BEGIN
  -- Get perfume cost per ml and margin
  SELECT 
    COALESCE(p.avg_cost_per_ml, 0) * size_ml_param,
    COALESCE(p.target_margin_percentage, 0.50)
  INTO perfume_cost, margin_percentage
  FROM perfumes p 
  WHERE p.id = perfume_uuid;
  
  -- Calculate materials cost
  SELECT COALESCE(SUM(m.cost_per_unit * pr.quantity_needed), 0)
  INTO materials_cost
  FROM product_recipes pr
  JOIN materials m ON pr.material_id = m.id
  WHERE pr.perfume_id = perfume_uuid 
    AND pr.size_ml = size_ml_param
    AND m.type = 'input'
    AND m.is_active = true;
  
  RETURN QUERY SELECT 
    perfume_cost as perfume_cost_per_unit,
    materials_cost as materials_cost_per_unit,
    (perfume_cost + materials_cost) as total_cost_per_unit,
    ROUND((perfume_cost + materials_cost) / (1 - margin_percentage), 2) as suggested_price;
END;
$$;

-- Create function to calculate packaging costs for an order
CREATE OR REPLACE FUNCTION public.calculate_packaging_costs(cart_items jsonb)
RETURNS TABLE(
  containers_needed jsonb,
  total_packaging_cost numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  item jsonb;
  total_items integer := 0;
  containers jsonb := '[]'::jsonb;
  total_cost numeric := 0;
  container_record record;
BEGIN
  -- Count total items in cart
  FOR item IN SELECT jsonb_array_elements(cart_items)
  LOOP
    total_items := total_items + COALESCE((item->>'quantity')::integer, 0);
  END LOOP;
  
  -- Find appropriate packaging rule (prioritize by priority, then max_items)
  SELECT pr.*, m.name as container_name, m.cost_per_unit
  INTO container_record
  FROM packaging_rules pr
  JOIN materials m ON pr.container_material_id = m.id
  WHERE pr.is_active = true 
    AND m.is_active = true
    AND m.type = 'input'
  ORDER BY pr.priority, pr.max_items DESC
  LIMIT 1;
  
  IF FOUND THEN
    -- Calculate how many containers needed
    DECLARE
      containers_needed_count integer;
    BEGIN
      containers_needed_count := CEIL(total_items::numeric / container_record.max_items::numeric);
      total_cost := containers_needed_count * container_record.cost_per_unit;
      
      containers := jsonb_build_array(
        jsonb_build_object(
          'material_id', container_record.container_material_id,
          'name', container_record.container_name,
          'quantity', containers_needed_count,
          'cost_per_unit', container_record.cost_per_unit,
          'total_cost', total_cost,
          'items_per_container', container_record.max_items
        )
      );
    END;
  END IF;
  
  RETURN QUERY SELECT containers, total_cost;
END;
$$;

-- Create trigger to update average cost when inventory lots change
CREATE OR REPLACE FUNCTION public.trigger_update_avg_cost()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_perfume_avg_cost(NEW.perfume_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_perfume_avg_cost(OLD.perfume_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER inventory_lots_avg_cost_trigger
AFTER INSERT OR UPDATE OR DELETE ON inventory_lots
FOR EACH ROW EXECUTE FUNCTION trigger_update_avg_cost();

-- Create trigger for updating timestamps
CREATE TRIGGER update_materials_updated_at
BEFORE UPDATE ON materials
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default materials
INSERT INTO public.materials (name, type, category, unit, cost_per_unit, description) VALUES
('Caixa Padrão', 'input', 'packaging', 'pieces', 2.50, 'Caixa padrão para envio de perfumes'),
('Frasco 5ml', 'input', 'packaging', 'pieces', 0.80, 'Frasco de vidro para perfumes de 5ml'),
('Frasco 10ml', 'input', 'packaging', 'pieces', 1.20, 'Frasco de vidro para perfumes de 10ml'),
('Frasco 50ml', 'input', 'packaging', 'pieces', 3.50, 'Frasco de vidro para perfumes de 50ml'),
('Etiqueta Adesiva', 'input', 'packaging', 'pieces', 0.15, 'Etiqueta com logo da marca'),
('Papel Seda', 'input', 'packaging', 'pieces', 0.25, 'Papel seda para embrulho'),
('Impressora de Etiquetas', 'asset', 'tools', 'pieces', 450.00, 'Impressora térmica para etiquetas'),
('Seringa 10ml', 'asset', 'tools', 'pieces', 15.00, 'Seringa para envase de perfumes');

-- Insert default packaging rule
INSERT INTO public.packaging_rules (container_material_id, max_items, priority)
SELECT id, 6, 1 FROM materials WHERE name = 'Caixa Padrão' LIMIT 1;