-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cart recovery to run every 4 hours
SELECT cron.schedule(
  'cart-recovery-job',
  '0 */4 * * *', -- Every 4 hours
  $$
  SELECT
    net.http_post(
        url:='https://vjlfwmwhvxlicykqetnk.supabase.co/functions/v1/cart-recovery',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbGZ3bXdodnhsaWN5a3FldG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTU5OTEsImV4cCI6MjA2Njg3MTk5MX0.ZmFEm8QDXXH-FEH8kAvpPYg35w6r1MrmayIirv4lPX4"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);