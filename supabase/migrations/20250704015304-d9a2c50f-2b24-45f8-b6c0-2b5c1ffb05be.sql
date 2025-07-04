-- Create loyalty tiers table
CREATE TABLE public.loyalty_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL DEFAULT 0,
  multiplier NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create points transactions table
CREATE TABLE public.points_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL,
  description TEXT,
  order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_tiers
CREATE POLICY "Anyone can view loyalty tiers" 
ON public.loyalty_tiers 
FOR SELECT 
USING (true);

-- RLS Policies for points_transactions
CREATE POLICY "Users can view their own points transactions" 
ON public.points_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own points transactions" 
ON public.points_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Insert default loyalty tiers
INSERT INTO public.loyalty_tiers (name, min_points, multiplier) VALUES
('Bronze', 0, 1.0),
('Prata', 500, 1.2),
('Ouro', 1500, 1.5),
('Platina', 3000, 2.0);

-- Function to get user's current points balance
CREATE OR REPLACE FUNCTION public.get_user_points_balance(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT balance_after 
     FROM public.points_transactions 
     WHERE user_id = user_uuid 
     ORDER BY created_at DESC 
     LIMIT 1), 
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add points transaction
CREATE OR REPLACE FUNCTION public.add_points_transaction(
  user_uuid UUID,
  points_delta INTEGER,
  transaction_source TEXT,
  transaction_description TEXT DEFAULT NULL,
  related_order_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
  transaction_id UUID;
BEGIN
  -- Get current balance
  current_balance := public.get_user_points_balance(user_uuid);
  new_balance := current_balance + points_delta;
  
  -- Insert transaction
  INSERT INTO public.points_transactions 
    (user_id, delta, balance_after, source, description, order_id)
  VALUES 
    (user_uuid, points_delta, new_balance, transaction_source, transaction_description, related_order_id)
  RETURNING id INTO transaction_id;
  
  -- Update user profile points
  UPDATE public.profiles 
  SET points = new_balance 
  WHERE id = user_uuid;
  
  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to award points when order is paid
CREATE OR REPLACE FUNCTION public.award_order_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Award points when order status changes to 'paid'
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    PERFORM public.add_points_transaction(
      NEW.user_id,
      FLOOR(NEW.total_amount)::INTEGER, -- 1 point per R$1
      'order_paid',
      'Pontos ganhos com pedido #' || NEW.order_number,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order points
DROP TRIGGER IF EXISTS order_points_trigger ON public.orders;
CREATE TRIGGER order_points_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.award_order_points();