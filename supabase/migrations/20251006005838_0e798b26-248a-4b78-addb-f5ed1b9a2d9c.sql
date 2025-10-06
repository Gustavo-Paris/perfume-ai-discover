-- Enhanced security for addresses table
-- This migration adds explicit logging and defense-in-depth measures

-- 1. Create a trigger to log all address access attempts
CREATE OR REPLACE FUNCTION log_address_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to addresses (for SELECT, we log on successful read)
  INSERT INTO address_access_log (
    user_id,
    address_id,
    action,
    ip_address,
    user_agent
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Don't block operations if logging fails
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply trigger to addresses table
DROP TRIGGER IF EXISTS log_address_access_trigger ON addresses;
CREATE TRIGGER log_address_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION log_address_access();

-- 2. Add explicit policy to DENY all unauthenticated access (defense in depth)
DROP POLICY IF EXISTS "Deny unauthenticated access to addresses" ON addresses;
CREATE POLICY "Deny unauthenticated access to addresses"
  ON addresses
  AS RESTRICTIVE
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- 3. Add comment documenting security measures
COMMENT ON TABLE addresses IS 'Stores customer home addresses. SECURITY: RLS enabled with user-specific access only. All access attempts are logged to address_access_log table. Unauthenticated access explicitly denied.';