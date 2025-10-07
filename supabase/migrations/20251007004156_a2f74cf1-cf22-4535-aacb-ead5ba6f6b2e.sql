-- FASE 2.2: Correção de Problemas de Segurança do Linter - Parte 2

-- Criar função para logging de eventos de segurança
CREATE OR REPLACE FUNCTION public.log_security_event(
  user_uuid uuid,
  event_type_param text,
  event_description_param text,
  risk_level_param text,
  metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    event_description,
    risk_level,
    metadata,
    ip_address
  )
  VALUES (
    user_uuid,
    event_type_param,
    event_description_param,
    risk_level_param,
    metadata_param,
    inet_client_addr()
  );
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the operation if logging fails
  RAISE WARNING 'Failed to log security event: %', SQLERRM;
END;
$$;