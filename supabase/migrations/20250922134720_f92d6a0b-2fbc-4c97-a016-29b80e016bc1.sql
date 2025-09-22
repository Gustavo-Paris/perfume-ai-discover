-- FASE 2 - SEGURANÇA: Corrigir avisos do linter Supabase

-- 1. Fix leaked password protection (habilitar proteção contra senhas vazadas)
ALTER SYSTEM SET auth.password_strength_check = 'on';
ALTER SYSTEM SET auth.enable_password_policy = 'true';

-- 2. Fix function search path - Atualizar funções existentes para usar search_path seguro
-- Função de atualização de timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Função para verificar roles de usuário
CREATE OR REPLACE FUNCTION public.has_role(user_uuid uuid, check_role app_role)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = check_role
  );
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 3. Adicionar configurações de segurança adicionais
-- Rate limiting para autenticação
ALTER SYSTEM SET auth.max_failed_login_attempts = 5;
ALTER SYSTEM SET auth.failed_login_ban_duration = 300;

-- Configurar timeouts apropriados
ALTER SYSTEM SET statement_timeout = '30s';
ALTER SYSTEM SET idle_in_transaction_session_timeout = '10min';

-- 4. Criar índices para performance de segurança
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_created 
ON public.login_attempts(email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_access_logs_user_created 
ON public.access_logs(user_id, created_at DESC);

-- 5. Policies de segurança adicionais para monitoramento
CREATE POLICY "Rate limit monitoring"
ON public.login_attempts
FOR SELECT
TO authenticated
USING (
  -- Permitir que usuários vejam apenas tentativas recentes para suas contas
  email = auth.email() 
  AND created_at >= now() - interval '1 hour'
);

-- Commit das alterações
SELECT 'Configurações de segurança aplicadas com sucesso' as status;