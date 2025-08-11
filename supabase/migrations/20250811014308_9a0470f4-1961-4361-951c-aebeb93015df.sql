-- Create table for Stripe payment event auditing
CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  transaction_id TEXT, -- Stripe Checkout Session ID or generic transaction identifier
  payment_intent_id TEXT,
  charge_id TEXT,
  status TEXT,
  amount NUMERIC,
  currency TEXT,
  raw_event JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Allow only admins to view events from the client
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'payment_events' 
      AND policyname = 'Admins can view payment events'
  ) THEN
    CREATE POLICY "Admins can view payment events"
    ON public.payment_events
    FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_payment_events_order_id ON public.payment_events(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_transaction_id ON public.payment_events(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_type ON public.payment_events(type);
CREATE INDEX IF NOT EXISTS idx_payment_events_created_at ON public.payment_events(created_at);