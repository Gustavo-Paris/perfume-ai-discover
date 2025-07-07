-- Add payment tracking fields to affiliate_referrals
ALTER TABLE affiliate_referrals 
ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_method TEXT,
ADD COLUMN payment_reference TEXT,
ADD COLUMN payment_notes TEXT;

-- Create affiliate_payments table for tracking payment batches
CREATE TABLE IF NOT EXISTS affiliate_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  notes TEXT,
  referral_ids UUID[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE affiliate_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for affiliate_payments
CREATE POLICY "Admins can manage affiliate payments" 
ON affiliate_payments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Affiliates can view their own payments" 
ON affiliate_payments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM affiliates 
  WHERE affiliates.id = affiliate_payments.affiliate_id 
  AND affiliates.user_id = auth.uid()
));