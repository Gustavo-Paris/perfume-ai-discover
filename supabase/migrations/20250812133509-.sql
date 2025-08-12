-- Secure affiliates data visibility and add server-side referral processing

-- 1) Harden RLS on affiliates
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Remove public-readable policy that leaks business data
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'affiliates' 
      AND policyname = 'Anyone can view active affiliate codes'
  ) THEN
    DROP POLICY "Anyone can view active affiliate codes" ON public.affiliates;
  END IF;
END $$;

-- Ensure users can create their own affiliate row safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'affiliates' 
      AND policyname = 'Users can create their own affiliate row'
  ) THEN
    CREATE POLICY "Users can create their own affiliate row"
    ON public.affiliates
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Keep: existing policies
--   "Admins can manage all affiliates" (ALL USING has_role(..., 'admin'))
--   "Users can view and manage their own affiliate data" (ALL USING auth.uid() = user_id)

-- 2) Create a SECURITY DEFINER function to process referrals without exposing affiliates
CREATE OR REPLACE FUNCTION public.process_affiliate_referral(
  affiliate_code text,
  order_id uuid,
  order_total numeric
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_affiliate_id uuid;
  v_commission_rate numeric := 0;
  v_total_referrals integer := 0;
  v_total_earnings numeric := 0;
  v_commission_amount numeric := 0;
BEGIN
  -- Find active affiliate by code
  SELECT a.id, COALESCE(a.commission_rate, 0), COALESCE(a.total_referrals, 0), COALESCE(a.total_earnings, 0)
    INTO v_affiliate_id, v_commission_rate, v_total_referrals, v_total_earnings
  FROM public.affiliates a
  WHERE a.affiliate_code = affiliate_code
    AND a.status = 'active'
  LIMIT 1;
  
  IF v_affiliate_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Prevent duplicate referral for the same order
  IF EXISTS (
    SELECT 1 FROM public.affiliate_referrals ar WHERE ar.order_id = order_id
  ) THEN
    RETURN true; -- already processed
  END IF;

  -- Calculate commission safely (never negative)
  v_commission_amount := GREATEST(COALESCE(order_total, 0) * COALESCE(v_commission_rate, 0), 0);

  -- Create referral
  INSERT INTO public.affiliate_referrals (affiliate_id, order_id, commission_amount, status)
  VALUES (v_affiliate_id, order_id, v_commission_amount, 'pending');

  -- Update affiliate aggregates
  UPDATE public.affiliates
  SET total_referrals = v_total_referrals + 1,
      total_earnings = v_total_earnings + v_commission_amount,
      updated_at = now()
  WHERE id = v_affiliate_id;

  RETURN true;
END;
$$;