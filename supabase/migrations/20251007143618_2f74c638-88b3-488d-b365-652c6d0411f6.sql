-- Move extensions to dedicated 'extensions' schema for security
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop and recreate extensions in the correct schema
DROP EXTENSION IF EXISTS pg_cron CASCADE;
DROP EXTENSION IF EXISTS pg_net CASCADE;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres;
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Recreate CRON jobs (they were dropped with CASCADE)
-- Cart recovery every 6 hours
SELECT cron.schedule(
  'cart-recovery-job',
  '0 */6 * * *',
  $$
  SELECT
    extensions.http_post(
      url:='https://vjlfwmwhvxlicykqetnk.supabase.co/functions/v1/cart-recovery',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbGZ3bXdodnhsaWN5a3FldG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTU5OTEsImV4cCI6MjA2Njg3MTk5MX0.ZmFEm8QDXXH-FEH8kAvpPYg35w6r1MrmayIirv4lPX4"}'::jsonb,
      body:=concat('{"scheduled_time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Stock alerts daily at 8 AM
SELECT cron.schedule(
  'stock-alerts-job',
  '0 8 * * *',
  $$
  SELECT
    extensions.http_post(
      url:='https://vjlfwmwhvxlicykqetnk.supabase.co/functions/v1/stock-alerts',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbGZ3bXdodnhsaWN5a3FldG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTU5OTEsImV4cCI6MjA2Njg3MTk5MX0.ZmFEm8QDXXH-FEH8kAvpPYg35w6r1MrmayIirv4lPX4"}'::jsonb,
      body:=concat('{"scheduled_time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Security monitor every 15 minutes
SELECT cron.schedule(
  'security-monitor-job',
  '*/15 * * * *',
  $$
  SELECT
    extensions.http_post(
      url:='https://vjlfwmwhvxlicykqetnk.supabase.co/functions/v1/security-monitor',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbGZ3bXdodnhsaWN5a3FldG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTU5OTEsImV4cCI6MjA2Njg3MTk5MX0.ZmFEm8QDXXH-FEH8kAvpPYg35w6r1MrmayIirv4lPX4"}'::jsonb,
      body:=concat('{"scheduled_time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
