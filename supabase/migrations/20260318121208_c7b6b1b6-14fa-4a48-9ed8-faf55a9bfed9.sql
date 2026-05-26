SELECT cron.unschedule('tiktokmine-mine-data-daily');
SELECT cron.schedule(
  'tiktokmine-mine-data-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jcjycpvapetyihvkblpg.supabase.co/functions/v1/mine-data',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjanljcHZhcGV0eWlodmtibHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjMxMjIsImV4cCI6MjA4NzY5OTEyMn0.UFG7j4wcW34DxelyKWigC6yV7VCgsd12yrVExSP-wBw"}'::jsonb,
    body := '{"type":"all"}'::jsonb
  ) AS request_id;
  $$
);
SELECT cron.unschedule('tiktokmine-migrate-thumbnails-daily');
SELECT cron.schedule(
  'tiktokmine-migrate-thumbnails-daily',
  '30 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jcjycpvapetyihvkblpg.supabase.co/functions/v1/migrate-thumbnails',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjanljcHZhcGV0eWlodmtibHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjMxMjIsImV4cCI6MjA4NzY5OTEyMn0.UFG7j4wcW34DxelyKWigC6yV7VCgsd12yrVExSP-wBw"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);