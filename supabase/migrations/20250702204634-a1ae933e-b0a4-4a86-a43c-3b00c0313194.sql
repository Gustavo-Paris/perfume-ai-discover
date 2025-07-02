
-- Create shipments table to store Melhor Envio shipping data
CREATE TABLE public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  melhor_envio_cart_id TEXT,
  melhor_envio_shipment_id TEXT,
  tracking_code TEXT,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cart_added', 'purchased', 'label_printed', 'shipped', 'delivered')),
  service_name TEXT,
  service_price NUMERIC(10,2),
  estimated_delivery_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- RLS policies for shipments
CREATE POLICY "Users can view their own shipments"
ON public.shipments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.orders 
  WHERE orders.id = shipments.order_id 
  AND orders.user_id = auth.uid()
));

CREATE POLICY "Users can create shipments for their orders"
ON public.shipments
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.orders 
  WHERE orders.id = shipments.order_id 
  AND orders.user_id = auth.uid()
));

CREATE POLICY "Users can update their own shipments"
ON public.shipments
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.orders 
  WHERE orders.id = shipments.order_id 
  AND orders.user_id = auth.uid()
));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_shipments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shipments_updated_at_trigger
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_shipments_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX idx_shipments_tracking_code ON public.shipments(tracking_code);
CREATE INDEX idx_shipments_status ON public.shipments(status);
