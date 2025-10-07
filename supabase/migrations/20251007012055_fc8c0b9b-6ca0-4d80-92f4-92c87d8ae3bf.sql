-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agendar execução do security-monitor a cada 10 minutos
SELECT cron.schedule(
  'security-monitor-job',
  '*/10 * * * *', -- A cada 10 minutos
  $$
  SELECT
    net.http_post(
      url:='https://vjlfwmwhvxlicykqetnk.supabase.co/functions/v1/security-monitor',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbGZ3bXdodnhsaWN5a3FldG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTU5OTEsImV4cCI6MjA2Njg3MTk5MX0.ZmFEm8QDXXH-FEH8kAvpPYg35w6r1MrmayIirv4lPX4"}'::jsonb,
      body:=json_build_object('scheduled', true)::jsonb
    ) as request_id;
  $$
);

-- Comentário explicativo
COMMENT ON EXTENSION pg_cron IS 'Executa tarefas agendadas no PostgreSQL';

-- Verificar jobs agendados (query útil para debug)
-- SELECT * FROM cron.job;