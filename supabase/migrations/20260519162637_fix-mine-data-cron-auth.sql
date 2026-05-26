-- Fix: mine-data cron was sending anon key in Authorization header.
-- supabase.auth.getUser(anonKey) returns user=null → function returned 401 → mining never ran.
-- The function has verify_jwt=false so no Authorization header is needed at all.
-- We reschedule without the header so the function's "no auth = cron call (allowed)" path is taken.

SELECT cron.unschedule('tiktokmine-mine-data-daily');
SELECT cron.schedule(
  'tiktokmine-mine-data-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://jcjycpvapetyihvkblpg.supabase.co/functions/v1/mine-data',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{"type":"all","triggered_by":"cron"}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.unschedule('tiktokmine-migrate-thumbnails-daily');
SELECT cron.schedule(
  'tiktokmine-migrate-thumbnails-daily',
  '30 2 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://jcjycpvapetyihvkblpg.supabase.co/functions/v1/migrate-thumbnails',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);
