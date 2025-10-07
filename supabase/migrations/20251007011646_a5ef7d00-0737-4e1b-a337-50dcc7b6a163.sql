-- Criar tabela de configurações de alertas de segurança
CREATE TABLE IF NOT EXISTS public.security_alert_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL UNIQUE,
  threshold_value integer NOT NULL DEFAULT 5,
  time_window_minutes integer NOT NULL DEFAULT 10,
  is_enabled boolean NOT NULL DEFAULT true,
  notification_channels jsonb NOT NULL DEFAULT '["email", "dashboard"]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Inserir configurações padrão
INSERT INTO public.security_alert_config (alert_type, threshold_value, time_window_minutes, notification_channels)
VALUES 
  ('failed_login_attempts', 5, 10, '["email", "dashboard"]'::jsonb),
  ('critical_events', 1, 60, '["email", "dashboard"]'::jsonb),
  ('rate_limit_exceeded', 10, 60, '["dashboard"]'::jsonb),
  ('unauthorized_access', 3, 30, '["email", "dashboard"]'::jsonb)
ON CONFLICT (alert_type) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.security_alert_config ENABLE ROW LEVEL SECURITY;

-- Policy para admins gerenciarem configurações
CREATE POLICY "Admins can manage security alert config"
  ON public.security_alert_config
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_security_alert_config_alert_type 
  ON public.security_alert_config(alert_type);

COMMENT ON TABLE public.security_alert_config IS 'Configurações de alertas automáticos de segurança';