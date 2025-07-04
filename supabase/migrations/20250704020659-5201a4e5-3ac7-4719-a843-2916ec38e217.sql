-- Create access logs table for LGPD compliance
CREATE TABLE public.access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  route TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create privacy consents table
CREATE TABLE public.privacy_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  consent_type TEXT NOT NULL,
  consented BOOLEAN NOT NULL DEFAULT false,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_consents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for access_logs
CREATE POLICY "Users can view their own access logs" 
ON public.access_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service can insert access logs" 
ON public.access_logs 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for privacy_consents
CREATE POLICY "Users can view their own consents" 
ON public.privacy_consents 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own consents" 
ON public.privacy_consents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own consents" 
ON public.privacy_consents 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Function to log user access
CREATE OR REPLACE FUNCTION public.log_user_access(
  user_uuid UUID,
  access_route TEXT,
  client_ip INET DEFAULT NULL,
  client_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.access_logs (user_id, route, ip_address, user_agent)
  VALUES (user_uuid, access_route, client_ip, client_user_agent)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old access logs (keep only 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_access_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.access_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to hard delete user and all related data (LGPD compliance)
CREATE OR REPLACE FUNCTION public.hard_delete_user_data(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Delete user's data in order (respecting foreign keys)
  
  -- Delete points transactions
  DELETE FROM public.points_transactions WHERE user_id = user_uuid;
  
  -- Delete cart items
  DELETE FROM public.cart_items WHERE user_id = user_uuid;
  
  -- Delete order items (through orders)
  DELETE FROM public.order_items WHERE order_id IN (
    SELECT id FROM public.orders WHERE user_id = user_uuid
  );
  
  -- Delete shipments (through orders)
  DELETE FROM public.shipments WHERE order_id IN (
    SELECT id FROM public.orders WHERE user_id = user_uuid
  );
  
  -- Delete orders
  DELETE FROM public.orders WHERE user_id = user_uuid;
  
  -- Delete order drafts
  DELETE FROM public.order_drafts WHERE user_id = user_uuid;
  
  -- Delete addresses
  DELETE FROM public.addresses WHERE user_id = user_uuid;
  
  -- Delete recommendation sessions
  DELETE FROM public.recommendation_sessions WHERE user_id = user_uuid;
  
  -- Delete conversational sessions
  DELETE FROM public.conversational_sessions WHERE user_id = user_uuid;
  
  -- Delete access logs
  DELETE FROM public.access_logs WHERE user_id = user_uuid;
  
  -- Delete privacy consents
  DELETE FROM public.privacy_consents WHERE user_id = user_uuid;
  
  -- Delete user roles
  DELETE FROM public.user_roles WHERE user_id = user_uuid;
  
  -- Delete profile
  DELETE FROM public.profiles WHERE id = user_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;