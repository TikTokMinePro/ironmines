
-- JOB 1: Mineração de dados — todo dia 00:00 UTC (21:00 BRT)
select cron.schedule(
  'tiktokmine-mine-data-daily',
  '0 0 * * *',
  $$
  select net.http_post(
    url:='https://jcjycpvapetyihvkblpg.supabase.co/functions/v1/mine-data',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjanljcHZhcGV0eWlodmtibHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjMxMjIsImV4cCI6MjA4NzY5OTEyMn0.UFG7j4wcW34DxelyKWigC6yV7VCgsd12yrVExSP-wBw"}'::jsonb,
    body:='{"triggered_by":"cron"}'::jsonb
  ) as request_id;
  $$
);

-- JOB 2: Processar alertas — 00:30 UTC
select cron.schedule(
  'tiktokmine-process-user-alerts',
  '30 0 * * *',
  $$
  select net.http_post(
    url:='https://jcjycpvapetyihvkblpg.supabase.co/functions/v1/process-alerts',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjanljcHZhcGV0eWlodmtibHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjMxMjIsImV4cCI6MjA4NzY5OTEyMn0.UFG7j4wcW34DxelyKWigC6yV7VCgsd12yrVExSP-wBw"}'::jsonb,
    body:='{"triggered_by":"cron"}'::jsonb
  ) as request_id;
  $$
);

-- JOB 3: Verificar assinaturas — 08:00 UTC (05:00 BRT)
select cron.schedule(
  'tiktokmine-check-expiring-subscriptions',
  '0 8 * * *',
  $$
  select net.http_post(
    url:='https://jcjycpvapetyihvkblpg.supabase.co/functions/v1/check-expiring-subscriptions',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjanljcHZhcGV0eWlodmtibHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjMxMjIsImV4cCI6MjA4NzY5OTEyMn0.UFG7j4wcW34DxelyKWigC6yV7VCgsd12yrVExSP-wBw"}'::jsonb,
    body:='{"triggered_by":"cron"}'::jsonb
  ) as request_id;
  $$
);
