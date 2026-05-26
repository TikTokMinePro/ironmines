
SELECT cron.schedule(
  'tiktokmine-migrate-thumbnails-daily',
  '30 0 * * *',
  $$
  SELECT net.http_post(
    url:='https://jcjycpvapetyihvkblpg.supabase.co/functions/v1/migrate-thumbnails',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjanljcHZhcGV0eWlodmtibHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjMxMjIsImV4cCI6MjA4NzY5OTEyMn0.UFG7j4wcW34DxelyKWigC6yV7VCgsd12yrVExSP-wBw"}'::jsonb,
    body:='{"triggered_by": "cron"}'::jsonb
  ) AS request_id;
  $$
);
