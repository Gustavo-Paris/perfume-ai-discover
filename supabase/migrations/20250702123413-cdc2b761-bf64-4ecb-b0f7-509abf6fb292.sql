
-- Create orders table to store confirmed orders
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  total_amount NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'credit_card')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  transaction_id TEXT,
  shipping_service TEXT,
  shipping_deadline INTEGER,
  address_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table to store items in each order
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  perfume_id UUID NOT NULL REFERENCES public.perfumes(id) ON DELETE RESTRICT,
  size_ml INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generate order number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  order_number TEXT;
BEGIN
  -- Get the next number based on existing orders
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.orders
  WHERE order_number ~ '^PC[0-9]+$';
  
  -- Format as PC + 6 digits
  order_number := 'PC' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate order numbers
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for orders
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own orders"
ON public.orders
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own orders"
ON public.orders
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS policies for order_items
CREATE POLICY "Users can view their own order items"
ON public.order_items
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.orders 
  WHERE orders.id = order_items.order_id 
  AND orders.user_id = auth.uid()
));

CREATE POLICY "Users can create their own order items"
ON public.order_items
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.orders 
  WHERE orders.id = order_items.order_id 
  AND orders.user_id = auth.uid()
));

-- Create indexes for better performance
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
