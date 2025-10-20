-- Add security documentation and verify RLS policies for sensitive tables
-- Addresses and shipments tables contain sensitive personal information

-- Add comments documenting security measures
COMMENT ON TABLE addresses IS 'Contains sensitive PII (home addresses, CPF/CNPJ). Protected by RLS policies ensuring users can only access their own addresses. Access monitoring via address_access_log table.';
COMMENT ON TABLE shipments IS 'Contains delivery tracking codes. Protected by RLS policies ensuring users can only access shipments for their own orders. Admins have full access for order management.';
COMMENT ON TABLE address_access_log IS 'Audit log for address table access. Tracks when users access address data for security monitoring.';

-- Verify RLS is enabled on sensitive tables
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE address_access_log ENABLE ROW LEVEL SECURITY;

-- Ensure admin policy exists for shipments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'shipments' 
    AND policyname = 'Admins can manage all shipments'
  ) THEN
    CREATE POLICY "Admins can manage all shipments"
    ON public.shipments
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Add indexes for better performance on access logs
CREATE INDEX IF NOT EXISTS idx_address_access_log_user_id ON address_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_address_access_log_created_at ON address_access_log(created_at);
CREATE INDEX IF NOT EXISTS idx_address_access_log_address_id ON address_access_log(address_id);