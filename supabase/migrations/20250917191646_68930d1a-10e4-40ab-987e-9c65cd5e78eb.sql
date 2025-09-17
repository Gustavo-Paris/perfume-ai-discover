-- CRITICAL SECURITY FIXES FOR DATA EXPOSURE VULNERABILITIES

-- 1. Fix Company Settings - Critical Business Data Protection
DROP POLICY IF EXISTS "Admins can manage company settings" ON company_settings;
CREATE POLICY "Admins can manage company settings" 
ON company_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix SAC Tickets - Customer Data Protection (LGPD Compliance)
DROP POLICY IF EXISTS "Users can view their own SAC tickets" ON sac_tickets;
DROP POLICY IF EXISTS "Users can update their own SAC tickets" ON sac_tickets;
DROP POLICY IF EXISTS "Authenticated users can create their own SAC tickets" ON sac_tickets;
DROP POLICY IF EXISTS "Admins can manage all SAC tickets" ON sac_tickets;

CREATE POLICY "Users can view their own SAC tickets" 
ON sac_tickets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own SAC tickets" 
ON sac_tickets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending SAC tickets" 
ON sac_tickets 
FOR UPDATE 
USING (auth.uid() = user_id AND status IN ('aberto', 'em_andamento'))
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all SAC tickets" 
ON sac_tickets 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix Payment Events - Financial Data Protection
DROP POLICY IF EXISTS "Admins can view payment events" ON payment_events;
CREATE POLICY "Admins can view payment events" 
ON payment_events 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Order owners can view their payment events" 
ON payment_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = payment_events.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- 4. Fix Access Logs - Admin Only Access
DROP POLICY IF EXISTS "Only admins can view access logs" ON access_logs;
DROP POLICY IF EXISTS "Service can insert access logs" ON access_logs;

CREATE POLICY "Only admins can view access logs" 
ON access_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert access logs" 
ON access_logs 
FOR INSERT 
WITH CHECK (true);

-- 5. Create Security Audit Log Table with Proper Protection (if not exists)
CREATE TABLE IF NOT EXISTS security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  event_description text NOT NULL,
  resource_type text,
  resource_id text,
  risk_level text DEFAULT 'medium',
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view security audit logs" 
ON security_audit_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert security audit logs" 
ON security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- 6. Create Compliance Audit Log Table with LGPD Protection (if not exists)
CREATE TABLE IF NOT EXISTS compliance_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details jsonb DEFAULT '{}',
  legal_basis text DEFAULT 'consent',
  ip_address inet,
  user_agent text,
  session_id text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE compliance_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view compliance audit logs" 
ON compliance_audit_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert compliance audit logs" 
ON compliance_audit_log 
FOR INSERT 
WITH CHECK (true);

-- 7. Enhanced Analytics Protection - Business Intelligence Security
DROP POLICY IF EXISTS "Users can view their own analytics" ON catalog_analytics;
DROP POLICY IF EXISTS "Users can insert their own analytics" ON catalog_analytics;
DROP POLICY IF EXISTS "Admins can view all analytics" ON catalog_analytics;

CREATE POLICY "Users can view their own analytics" 
ON catalog_analytics 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (user_id IS NULL AND session_id = current_setting('app.session_id', true))
);

CREATE POLICY "Users can insert their own analytics" 
ON catalog_analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all analytics" 
ON catalog_analytics 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. Enhanced Cart Sessions Protection
DROP POLICY IF EXISTS "Users can manage their own cart sessions" ON cart_sessions;
DROP POLICY IF EXISTS "Admins can view all cart sessions" ON cart_sessions;

CREATE POLICY "Users can manage their own cart sessions" 
ON cart_sessions 
FOR ALL 
USING (
  auth.uid() = user_id OR 
  (user_id IS NULL AND session_id = current_setting('app.session_id', true))
)
WITH CHECK (
  auth.uid() = user_id OR 
  (user_id IS NULL AND session_id = current_setting('app.session_id', true))
);

CREATE POLICY "Admins can view all cart sessions" 
ON cart_sessions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 9. Enhanced Search Queries Protection
DROP POLICY IF EXISTS "Users can view own searches or admin can view all" ON search_queries;
DROP POLICY IF EXISTS "Users can insert their own search queries" ON search_queries;
DROP POLICY IF EXISTS "Admins can view all search queries" ON search_queries;

CREATE POLICY "Users can view their own searches" 
ON search_queries 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (user_id IS NULL AND session_id = current_setting('app.session_id', true))
);

CREATE POLICY "Users can insert their own search queries" 
ON search_queries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all search queries" 
ON search_queries 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 10. Add Security Functions for Monitoring
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id uuid,
  p_event_type text,
  p_description text,
  p_risk_level text DEFAULT 'medium',
  p_metadata jsonb DEFAULT '{}'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO security_audit_log (
    user_id, event_type, event_description, risk_level, 
    ip_address, metadata
  )
  VALUES (
    p_user_id, p_event_type, p_description, p_risk_level,
    inet_client_addr(), p_metadata
  )
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;