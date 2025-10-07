-- Schedule cart recovery to run every 6 hours
-- This will check for abandoned carts and send recovery emails
DO $$
BEGIN
  -- Remove existing job if it exists
  PERFORM cron.unschedule('cart-recovery-job');
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'cart-recovery-job',
  '0 */6 * * *', -- Every 6 hours at minute 0
  $$
  SELECT
    extensions.http_post(
      'https://vjlfwmwhvxlicykqetnk.supabase.co/functions/v1/cart-recovery'::text,
      '{"scheduled_time": "' || now() || '"}'::jsonb,
      '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbGZ3bXdodnhsaWN5a3FldG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTU5OTEsImV4cCI6MjA2Njg3MTk5MX0.ZmFEm8QDXXH-FEH8kAvpPYg35w6r1MrmayIirv4lPX4"}'::jsonb
    );
  $$
);

-- Schedule stock alerts to run daily at 8 AM
DO $$
BEGIN
  PERFORM cron.unschedule('stock-alerts-job');
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'stock-alerts-job',
  '0 8 * * *', -- Every day at 8:00 AM
  $$
  SELECT
    extensions.http_post(
      'https://vjlfwmwhvxlicykqetnk.supabase.co/functions/v1/stock-alerts'::text,
      '{"scheduled_time": "' || now() || '"}'::jsonb,
      '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbGZ3bXdodnhsaWN5a3FldG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTU5OTEsImV4cCI6MjA2Njg3MTk5MX0.ZmFEm8QDXXH-FEH8kAvpPYg35w6r1MrmayIirv4lPX4"}'::jsonb
    );
  $$
);

-- Schedule security monitor to run every 15 minutes
DO $$
BEGIN
  PERFORM cron.unschedule('security-monitor-job');
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'security-monitor-job',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT
    extensions.http_post(
      'https://vjlfwmwhvxlicykqetnk.supabase.co/functions/v1/security-monitor'::text,
      '{"scheduled_time": "' || now() || '"}'::jsonb,
      '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbGZ3bXdodnhsaWN5a3FldG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTU5OTEsImV4cCI6MjA2Njg3MTk5MX0.ZmFEm8QDXXH-FEH8kAvpPYg35w6r1MrmayIirv4lPX4"}'::jsonb
    );
  $$
);
