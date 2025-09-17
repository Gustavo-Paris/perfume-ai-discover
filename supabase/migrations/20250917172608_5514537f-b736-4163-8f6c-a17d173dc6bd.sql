-- Optional: Add audit logging for address access
CREATE TABLE IF NOT EXISTS public.address_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  address_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'view', 'create', 'update', 'delete' 
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.address_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view address access logs"
ON public.address_access_log
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));