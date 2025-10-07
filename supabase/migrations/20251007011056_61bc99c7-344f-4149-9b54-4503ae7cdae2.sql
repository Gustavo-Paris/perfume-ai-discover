-- Verificar se a tabela existe e criar se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'security_audit_log') THEN
    CREATE TABLE public.security_audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      event_type TEXT NOT NULL,
      event_description TEXT NOT NULL,
      risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
      resource_type TEXT,
      resource_id TEXT,
      ip_address INET,
      user_agent TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    -- Criar índices
    CREATE INDEX idx_security_audit_log_user_id ON public.security_audit_log(user_id);
    CREATE INDEX idx_security_audit_log_event_type ON public.security_audit_log(event_type);
    CREATE INDEX idx_security_audit_log_risk_level ON public.security_audit_log(risk_level);
    CREATE INDEX idx_security_audit_log_created_at ON public.security_audit_log(created_at DESC);
    
    -- Habilitar RLS
    ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
    
    -- Comentários
    COMMENT ON TABLE public.security_audit_log IS 'Registra eventos de auditoria de segurança para compliance e monitoramento';
  END IF;
END $$;