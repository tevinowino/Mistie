-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule the cron job to run every day at 10:00 AM UTC
-- Replace the URL with your actual Edge Function URL
select cron.schedule(
  'check-anniversaries-daily', -- name of the job
  '0 00 * * *',                -- every day at 12:00am
  $$
  select
    net.http_post(
        url:='https://eadkkxsqjoutwtmovtpc.supabase.co/functions/v1/check-anniversaries',
        headers:='{"Content-Type": "application/json"}',
        body:='{}'
    ) as request_id;
  $$
);

-- To check if it exists:
-- select * from cron.job;

-- To unschedule:
-- select cron.unschedule('check-anniversaries-daily');
