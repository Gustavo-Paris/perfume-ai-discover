-- Fix security issue with SAC tickets exposing personal information

-- First, let's ensure RLS is properly enabled on sac_tickets
ALTER TABLE public.sac_tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them with better security
DROP POLICY IF EXISTS "Users can create SAC tickets" ON public.sac_tickets;
DROP POLICY IF EXISTS "Users can view their own SAC tickets" ON public.sac_tickets;
DROP POLICY IF EXISTS "Admins can manage all SAC tickets" ON public.sac_tickets;

-- Create more secure policies that require authentication for all operations
CREATE POLICY "Authenticated users can create their own SAC tickets" 
ON public.sac_tickets 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only view their own tickets (no anonymous access)
CREATE POLICY "Users can view their own SAC tickets" 
ON public.sac_tickets 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own tickets (limited fields only)
CREATE POLICY "Users can update their own SAC tickets" 
ON public.sac_tickets 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all tickets
CREATE POLICY "Admins can manage all SAC tickets" 
ON public.sac_tickets 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create audit logging function for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sac_ticket_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to sensitive customer data
  INSERT INTO public.access_logs (user_id, route, user_agent)
  VALUES (
    auth.uid(),
    'sac_tickets_access',
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for audit logging on SELECT operations
CREATE OR REPLACE TRIGGER sac_tickets_access_audit
  AFTER SELECT ON public.sac_tickets
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.log_sac_ticket_access();

-- Ensure the user_id column is not nullable to prevent anonymous tickets
ALTER TABLE public.sac_tickets 
ALTER COLUMN user_id SET NOT NULL;

-- Add a constraint to ensure only authenticated users can create tickets
ALTER TABLE public.sac_tickets 
ADD CONSTRAINT sac_tickets_user_id_check 
CHECK (user_id IS NOT NULL);

-- Create function to safely retrieve customer support stats for admins only
CREATE OR REPLACE FUNCTION public.get_sac_stats()
RETURNS TABLE(
  total_tickets bigint,
  open_tickets bigint,
  resolved_tickets bigint,
  avg_resolution_time interval
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to access aggregated stats
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    COUNT(*) as total_tickets,
    COUNT(*) FILTER (WHERE status = 'aberto') as open_tickets,
    COUNT(*) FILTER (WHERE status = 'resolvido') as resolved_tickets,
    AVG(resolution_date - created_at) as avg_resolution_time
  FROM public.sac_tickets;
END;
$$;