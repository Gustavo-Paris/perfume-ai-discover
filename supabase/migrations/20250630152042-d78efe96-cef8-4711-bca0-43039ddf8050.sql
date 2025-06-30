
-- Create perfumes table
CREATE TABLE public.perfumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  family TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('masculino', 'feminino', 'unissex')),
  top_notes TEXT[] DEFAULT '{}',
  heart_notes TEXT[] DEFAULT '{}',
  base_notes TEXT[] DEFAULT '{}',
  price_5ml DECIMAL(10,2),
  price_10ml DECIMAL(10,2),
  price_full DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create warehouses table
CREATE TABLE public.warehouses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory lots table
CREATE TABLE public.inventory_lots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  perfume_id UUID REFERENCES public.perfumes(id) ON DELETE CASCADE NOT NULL,
  lot_code TEXT NOT NULL,
  expiry_date DATE,
  qty_ml INTEGER NOT NULL DEFAULT 0,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lot_code, perfume_id)
);

-- Create stock movements table
CREATE TABLE public.stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  perfume_id UUID REFERENCES public.perfumes(id) ON DELETE CASCADE NOT NULL,
  lot_id UUID REFERENCES public.inventory_lots(id) ON DELETE CASCADE,
  change_ml INTEGER NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'fraction', 'sale', 'return', 'adjust')),
  related_order_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.perfumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Create user roles enum and table for admin access
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

CREATE TABLE public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for perfumes (public read, admin write)
CREATE POLICY "Anyone can view perfumes" 
  ON public.perfumes 
  FOR SELECT 
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage perfumes" 
  ON public.perfumes 
  FOR ALL 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for warehouses (admin only)
CREATE POLICY "Admins can manage warehouses" 
  ON public.warehouses 
  FOR ALL 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for inventory lots (admin only)
CREATE POLICY "Admins can manage inventory lots" 
  ON public.inventory_lots 
  FOR ALL 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for stock movements (admin only)
CREATE POLICY "Admins can manage stock movements" 
  ON public.stock_movements 
  FOR ALL 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user roles
CREATE POLICY "Users can view their own roles" 
  ON public.user_roles 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" 
  ON public.user_roles 
  FOR ALL 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default warehouse
INSERT INTO public.warehouses (name, location, is_primary) 
VALUES ('Estoque Principal', 'São Paulo, SP', true);

-- Seed demo perfumes
INSERT INTO public.perfumes (brand, name, description, family, gender, top_notes, heart_notes, base_notes, price_5ml, price_10ml, price_full, category) VALUES 
-- Masculinos
('Tom Ford', 'Oud Wood', 'Uma fragrância amadeirada oriental luxuosa', 'Oriental Amadeirada', 'masculino', ARRAY['Pau-rosa', 'Cardamomo'], ARRAY['Oud', 'Sândalo'], ARRAY['Âmbar', 'Vanilla'], 89.90, 159.90, 899.90, 'Premium'),
('Creed', 'Aventus', 'Clássico masculino com notas frutais e amadeiradas', 'Frutal Amadeirada', 'masculino', ARRAY['Abacaxi', 'Maçã', 'Bergamota'], ARRAY['Folhas secas', 'Gerânio'], ARRAY['Carvalho', 'Almíscar', 'Âmbar'], 99.90, 179.90, 1299.90, 'Premium'),
('Dior', 'Sauvage', 'Fragrância fresca e selvagem', 'Aromática Amadeirada', 'masculino', ARRAY['Bergamota', 'Pimenta'], ARRAY['Gerânio', 'Lavanda', 'Sichuan'], ARRAY['Cedro', 'Labdanum', 'Âmbar'], 69.90, 119.90, 549.90, 'Designer'),
('Paco Rabanne', '1 Million', 'Dourado e sedutor', 'Oriental Especiada', 'masculino', ARRAY['Toranja', 'Menta'], ARRAY['Canela', 'Rosa'], ARRAY['Couro', 'Âmbar', 'Patchouli'], 49.90, 89.90, 389.90, 'Designer'),
('Hugo Boss', 'Bottled', 'Clássico elegante e versátil', 'Amadeirada Aromática', 'masculino', ARRAY['Maçã', 'Bergamota'], ARRAY['Gerânio', 'Canela'], ARRAY['Sândalo', 'Cedro', 'Oliveira'], 39.90, 69.90, 289.90, 'Designer'),

-- Femininos
('Chanel', 'Coco Mademoiselle', 'Elegância feminina moderna', 'Oriental Floral', 'feminino', ARRAY['Laranja', 'Bergamota'], ARRAY['Rosa', 'Jasmim'], ARRAY['Patchouli', 'Vanilla', 'Almíscar'], 79.90, 139.90, 699.90, 'Premium'),
('Viktor & Rolf', 'Flowerbomb', 'Explosão floral intensa', 'Floral Oriental', 'feminino', ARRAY['Chá', 'Bergamota'], ARRAY['Jasmim', 'Rosa', 'Orquídea'], ARRAY['Patchouli', 'Almíscar'], 69.90, 119.90, 599.90, 'Designer'),
('Marc Jacobs', 'Daisy', 'Frescor jovial e delicado', 'Floral Frutal', 'feminino', ARRAY['Morango Silvestre', 'Violeta'], ARRAY['Gardênia', 'Jasmim'], ARRAY['Almíscar', 'Vanilla'], 49.90, 89.90, 399.90, 'Designer'),
('Lancôme', 'La Vie Est Belle', 'Felicidade em uma fragrância', 'Floral Frutal Gourmand', 'feminino', ARRAY['Pêra', 'Groselha Preta'], ARRAY['Íris', 'Jasmim'], ARRAY['Pralinê', 'Baunilha', 'Patchouli'], 59.90, 109.90, 489.90, 'Designer'),
('Dolce & Gabbana', 'Light Blue', 'Frescor mediterrâneo', 'Floral Frutal', 'feminino', ARRAY['Limão Siciliano', 'Maçã'], ARRAY['Jasmim', 'Bambu'], ARRAY['Cedro', 'Âmbar', 'Almíscar'], 45.90, 79.90, 349.90, 'Designer'),

-- Unissex
('Le Labo', 'Santal 33', 'Sândalo cremoso e viciante', 'Amadeirada', 'unissex', ARRAY['Cardamomo', 'Íris', 'Violeta'], ARRAY['Ambroxan', 'Sândalo'], ARRAY['Cedro', 'Couro', 'Papiro'], 119.90, 219.90, 1499.90, 'Nicho'),
('Maison Margiela', 'By the Fireplace', 'Aconchego junto à lareira', 'Oriental Amadeirada', 'unissex', ARRAY['Laranja', 'Cravo'], ARRAY['Castanha', 'Gaiac'], ARRAY['Baunilha', 'Cashmeran'], 89.90, 159.90, 799.90, 'Nicho');
