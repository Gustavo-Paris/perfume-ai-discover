-- Enable required extensions for CRON jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule cart recovery to run every 6 hours
-- This will check for abandoned carts and send recovery emails
SELECT cron.schedule(
  'cart-recovery-job',
  '0 */6 * * *', -- Every 6 hours at minute 0
  $$
  SELECT
    net.http_post(
      url:='https://vjlfwmwhvxlicykqetnk.supabase.co/functions/v1/cart-recovery',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbGZ3bXdodnhsaWN5a3FldG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTU5OTEsImV4cCI6MjA2Njg3MTk5MX0.ZmFEm8QDXXH-FEH8kAvpPYg35w6r1MrmayIirv4lPX4"}'::jsonb,
      body:=concat('{"scheduled_time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Also schedule stock alerts to run daily at 8 AM
SELECT cron.schedule(
  'stock-alerts-job',
  '0 8 * * *', -- Every day at 8:00 AM
  $$
  SELECT
    net.http_post(
      url:='https://vjlfwmwhvxlicykqetnk.supabase.co/functions/v1/stock-alerts',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbGZ3bXdodnhsaWN5a3FldG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTU5OTEsImV4cCI6MjA2Njg3MTk5MX0.ZmFEm8QDXXH-FEH8kAvpPYg35w6r1MrmayIirv4lPX4"}'::jsonb,
      body:=concat('{"scheduled_time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Schedule security monitor to run every 15 minutes
SELECT cron.schedule(
  'security-monitor-job',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT
    net.http_post(
      url:='https://vjlfwmwhvxlicykqetnk.supabase.co/functions/v1/security-monitor',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbGZ3bXdodnhsaWN5a3FldG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTU5OTEsImV4cCI6MjA2Njg3MTk5MX0.ZmFEm8QDXXH-FEH8kAvpPYg35w6r1MrmayIirv4lPX4"}'::jsonb,
      body:=concat('{"scheduled_time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- View all scheduled jobs
-- SELECT * FROM cron.job;

-- To unschedule a job later, use:
-- SELECT cron.unschedule('cart-recovery-job');
