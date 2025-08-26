-- ==========================================
-- PHASE 1: CRITICAL LEGAL COMPLIANCE & SECURITY FIXES
-- ==========================================

-- 1. Fix RLS for sensitive data exposure
-- Currently search_queries allows public access, should be restricted

-- Update search_queries RLS
DROP POLICY IF EXISTS "Users can view their own search queries" ON public.search_queries;
CREATE POLICY "Users can view own searches or admin can view all"
ON public.search_queries 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND session_id = current_setting('app.session_id', true)) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Update access_logs RLS to be more restrictive
DROP POLICY IF EXISTS "Users can view their own access logs" ON public.access_logs;
CREATE POLICY "Only admins can view access logs"
ON public.access_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Create missing tables for legal compliance

-- Terms of Use acceptance tracking
CREATE TABLE IF NOT EXISTS public.terms_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  version TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL DEFAULT 'terms_of_use' -- 'terms_of_use', 'privacy_policy'
);

ALTER TABLE public.terms_acceptance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own terms acceptance"
ON public.terms_acceptance 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own terms acceptance"
ON public.terms_acceptance 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Legal documents management
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'privacy_policy', 'terms_of_use', 'return_policy', 'delivery_policy'
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  effective_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  requires_acceptance BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active legal documents"
ON public.legal_documents 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage legal documents"
ON public.legal_documents 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Cookie consent management (enhanced)
ALTER TABLE public.privacy_consents 
ADD COLUMN IF NOT EXISTS cookie_categories JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS browser_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS legal_basis TEXT DEFAULT 'consent',
ADD COLUMN IF NOT EXISTS data_retention_days INTEGER DEFAULT 730;

-- 3. Company information table (CNPJ, address, etc.)
CREATE TABLE IF NOT EXISTS public.company_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT NOT NULL UNIQUE,
  inscricao_estadual TEXT,
  inscricao_municipal TEXT,
  endereco_completo TEXT NOT NULL,
  cep TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email_contato TEXT NOT NULL,
  email_sac TEXT NOT NULL,
  responsavel_tecnico TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view company info"
ON public.company_info 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage company info"
ON public.company_info 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default company info
INSERT INTO public.company_info (
  razao_social, 
  nome_fantasia, 
  cnpj, 
  endereco_completo, 
  cep, 
  cidade, 
  estado, 
  telefone, 
  email_contato, 
  email_sac,
  responsavel_tecnico
) VALUES (
  'PARIS & CO PARFUMS LTDA',
  'Paris & Co Parfums',
  '00.000.000/0001-00', -- PLACEHOLDER - substituir pelo CNPJ real
  'Rua Exemplo, 123, Centro',
  '00000-000', -- PLACEHOLDER
  'São Paulo',
  'SP',
  '(11) 0000-0000', -- PLACEHOLDER
  'contato@pariscoparfums.com.br',
  'sac@pariscoparfums.com.br',
  'Responsável Técnico' -- PLACEHOLDER
) ON CONFLICT (cnpj) DO NOTHING;

-- 4. SAC (Customer Service) structured system
CREATE TABLE IF NOT EXISTS public.sac_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  protocol_number TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'duvida', 'reclamacao', 'sugestao', 'troca_devolucao', 'cancelamento'
  subcategory TEXT,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  order_number TEXT,
  priority TEXT NOT NULL DEFAULT 'normal', -- 'baixa', 'normal', 'alta', 'urgente'
  status TEXT NOT NULL DEFAULT 'aberto', -- 'aberto', 'em_andamento', 'aguardando_cliente', 'resolvido', 'fechado'
  assigned_to UUID,
  resolution TEXT,
  resolution_date TIMESTAMP WITH TIME ZONE,
  first_response_at TIMESTAMP WITH TIME ZONE,
  sla_due_date TIMESTAMP WITH TIME ZONE,
  satisfaction_rating INTEGER, -- 1-5
  satisfaction_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sac_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create SAC tickets"
ON public.sac_tickets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own SAC tickets"
ON public.sac_tickets 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can manage all SAC tickets"
ON public.sac_tickets 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Generate protocol number function
CREATE OR REPLACE FUNCTION generate_sac_protocol()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  protocol TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(protocol_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.sac_tickets
  WHERE protocol_number ~ '^SAC[0-9]+$';
  
  protocol := 'SAC' || LPAD(next_number::TEXT, 6, '0');
  RETURN protocol;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate protocol
CREATE OR REPLACE FUNCTION set_sac_protocol()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.protocol_number IS NULL OR NEW.protocol_number = '' THEN
    NEW.protocol_number := generate_sac_protocol();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_sac_protocol
  BEFORE INSERT ON public.sac_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_sac_protocol();

-- 5. Rate limiting enhancement
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  ip_address INET,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only system can manage rate limits"
ON public.rate_limits 
FOR ALL 
USING (false); -- Only accessible via functions

-- Rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_endpoint TEXT DEFAULT 'general',
  p_limit INTEGER DEFAULT 60,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Count recent requests
  SELECT COALESCE(SUM(request_count), 0)
  INTO current_count
  FROM public.rate_limits
  WHERE (p_user_id IS NULL OR user_id = p_user_id)
    AND (p_ip_address IS NULL OR ip_address = p_ip_address)
    AND endpoint = p_endpoint
    AND window_start > window_start;
  
  -- Check if limit exceeded
  IF current_count >= p_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Record this request
  INSERT INTO public.rate_limits (user_id, ip_address, endpoint, request_count)
  VALUES (p_user_id, p_ip_address, p_endpoint, 1)
  ON CONFLICT (user_id, ip_address, endpoint, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1;
  
  RETURN TRUE;
END;
$$;

-- 6. Enhanced audit logging
CREATE TABLE IF NOT EXISTS public.compliance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action_type TEXT NOT NULL, -- 'data_access', 'data_modification', 'consent_given', 'consent_withdrawn', 'data_export', 'data_deletion'
  resource_type TEXT NOT NULL, -- 'user_data', 'order', 'review', 'privacy_consent', etc.
  resource_id TEXT,
  details JSONB,
  legal_basis TEXT, -- 'consent', 'contract', 'legitimate_interest', etc.
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.compliance_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view compliance audit log"
ON public.compliance_audit_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to log compliance events
CREATE OR REPLACE FUNCTION log_compliance_event(
  p_user_id UUID,
  p_action_type TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_legal_basis TEXT DEFAULT 'consent',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.compliance_audit_log (
    user_id, action_type, resource_type, resource_id, 
    details, legal_basis, ip_address, user_agent, session_id
  )
  VALUES (
    p_user_id, p_action_type, p_resource_type, p_resource_id,
    p_details, p_legal_basis, p_ip_address, p_user_agent, p_session_id
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Insert default legal documents
INSERT INTO public.legal_documents (type, version, title, content, effective_date, is_active) VALUES 
(
  'privacy_policy',
  '1.0',
  'Política de Privacidade',
  'Esta é a Política de Privacidade da Paris & Co Parfums. [CONTEÚDO DEVE SER ELABORADO POR ADVOGADO ESPECIALISTA EM LGPD]',
  CURRENT_DATE,
  true
),
(
  'terms_of_use',
  '1.0', 
  'Termos de Uso',
  'Estes são os Termos de Uso da Paris & Co Parfums. [CONTEÚDO DEVE SER ELABORADO POR ADVOGADO ESPECIALISTA]',
  CURRENT_DATE,
  true
),
(
  'return_policy',
  '1.0',
  'Política de Trocas e Devoluções',
  'Esta é a Política de Trocas e Devoluções da Paris & Co Parfums conforme o Código de Defesa do Consumidor.',
  CURRENT_DATE,
  true
) ON CONFLICT DO NOTHING;

-- 7. Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_info_updated_at
  BEFORE UPDATE ON public.company_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sac_tickets_updated_at
  BEFORE UPDATE ON public.sac_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();