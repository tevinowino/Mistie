-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule the cron job to run 3 times a day (Midnight, 8 AM, 4 PM UTC)
select cron.schedule(
  'check-streaks-thrice-daily',
  '0 0,8,16 * * *',
  $$
  select
    net.http_post(
        url:='https://eadkkxsqjoutwtmovtpc.supabase.co/functions/v1/check-streaks',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer SERVICE_ROLE_KEY_HERE"}', 
        -- Note: Usually Authorization is needed if the function is not public. 
        -- Based on previous pattern, user might have set it to public or handles it differently.
        -- Assuming 'Authorization' header might be needed if it's protected, BUT 
        -- the previous file (`cron_anniversaries.sql`) didn't include one in the body/headers example 
        -- (it just had Content-Type).
        -- However, it's safer to mention strict security.
        -- Given the user provided the URL directly and asked for the cron, 
        -- I'll follow the exact pattern from `cron_anniversaries.sql` which did NOT have Auth headers visible there.
        -- If the function is "Verify JWT" enabled, it needs a key. If "no verify", it doesn't.
        -- For safety, I will stick to the previous successful pattern.
        
        body:='{}'
    ) as request_id;
  $$
);

-- To check if it exists:
-- select * from cron.job;

-- To unschedule:
-- select cron.unschedule('check-streaks-thrice-daily');
