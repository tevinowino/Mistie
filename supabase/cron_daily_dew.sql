-- ============================================================================
-- DAILY DEW CRON JOBS SETUP
-- ============================================================================
-- This script sets up cron jobs for the Daily Dew feature:
-- 1. Daily job to assign dews to all couples (6 AM EAT / 3 AM UTC)
-- 2. Weekly job to refill the prompt pool with AI-generated questions
-- ============================================================================

-- Ensure extensions are enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ----------------------------------------------------------------------------
-- Add category column to daily_dew_prompts if not exists
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_dew_prompts' AND column_name = 'category'
  ) THEN
    ALTER TABLE daily_dew_prompts ADD COLUMN category TEXT;
  END IF;
END $$;

-- Add unique constraint on question_text for upsert deduplication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_dew_prompts_question_text_key'
  ) THEN
    ALTER TABLE daily_dew_prompts ADD CONSTRAINT daily_dew_prompts_question_text_key UNIQUE (question_text);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- JOB 1: Generate Daily Dews (Every day at 3 AM UTC = 6 AM EAT)
-- ----------------------------------------------------------------------------
-- First, remove existing job if it exists
SELECT cron.unschedule('generate-daily-dews') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-dews'
);

-- Schedule the daily job
SELECT cron.schedule(
  'generate-daily-dews',           -- job name
  '0 3 * * *',                     -- cron expression: 3 AM UTC daily
  $$
  SELECT net.http_post(
    url := 'https://eadkkxsqjoutwtmovtpc.supabase.co/functions/v1/generate-daily-dew',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ----------------------------------------------------------------------------
-- JOB 2: Refill Dew Pool (Every Sunday at 2 AM UTC)
-- ----------------------------------------------------------------------------
-- First, remove existing job if it exists
SELECT cron.unschedule('refill-dew-pool') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'refill-dew-pool'
);

-- Schedule the weekly refill job
SELECT cron.schedule(
  'refill-dew-pool',               -- job name
  '0 2 * * 0',                     -- cron expression: 2 AM UTC every Sunday
  $$
  SELECT net.http_post(
    url := 'https://eadkkxsqjoutwtmovtpc.supabase.co/functions/v1/refill-dew-pool',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := '{"count": 50}'::jsonb
  ) AS request_id;
  $$
);

-- ----------------------------------------------------------------------------
-- VERIFICATION QUERIES
-- ----------------------------------------------------------------------------
-- Check scheduled jobs:
-- SELECT * FROM cron.job;

-- Check job execution history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Check pool size:
-- SELECT COUNT(*) as pool_size FROM daily_dew_prompts;

-- To manually trigger refill (for testing):
-- SELECT net.http_post(
--   url := 'https://eadkkxsqjoutwtmovtpc.supabase.co/functions/v1/refill-dew-pool',
--   headers := '{"Content-Type": "application/json"}'::jsonb,
--   body := '{"force": true}'::jsonb
-- );
