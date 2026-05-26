
-- =============================================
-- 1. Drop old tables
-- =============================================
DROP TABLE IF EXISTS plan_limits CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;

-- =============================================
-- 2. Remove old columns from profiles
-- =============================================
ALTER TABLE profiles DROP COLUMN IF EXISTS plan;
ALTER TABLE profiles DROP COLUMN IF EXISTS creatives_used_this_month;
ALTER TABLE profiles DROP COLUMN IF EXISTS alerts_count;

-- Drop the old enum type if not used elsewhere
DROP TYPE IF EXISTS app_plan CASCADE;

-- =============================================
-- 3. New subscriptions table (duration-based)
-- =============================================
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  duration_months int NOT NULL CHECK (duration_months IN (1, 3, 6)),
  amount_cents int NOT NULL CHECK (amount_cents IN (6990, 18990, 39990)),
  ironpay_order_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 4. Trigger to auto-calculate expires_at
-- =============================================
CREATE OR REPLACE FUNCTION public.set_expires_at()
RETURNS trigger AS $$
BEGIN
  NEW.expires_at = NEW.started_at + (interval '1 month' * NEW.duration_months);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_set_expires_at
  BEFORE INSERT OR UPDATE OF started_at, duration_months
  ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_expires_at();

-- =============================================
-- 5. Setup pg_cron and pg_net extensions
-- =============================================
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA cron TO postgres;

-- =============================================
-- 6. Schedule cron jobs (using direct URLs)
-- =============================================
SELECT cron.schedule(
  'tiktokmine-mine-data-daily',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jcjycpvapetyihvkblpg.supabase.co/functions/v1/mine-data',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjanljcHZhcGV0eWlodmtibHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjMxMjIsImV4cCI6MjA4NzY5OTEyMn0.UFG7j4wcW34DxelyKWigC6yV7VCgsd12yrVExSP-wBw"}'::jsonb,
    body := '{"triggered_by":"cron"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'tiktokmine-process-user-alerts',
  '30 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jcjycpvapetyihvkblpg.supabase.co/functions/v1/process-alerts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjanljcHZhcGV0eWlodmtibHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjMxMjIsImV4cCI6MjA4NzY5OTEyMn0.UFG7j4wcW34DxelyKWigC6yV7VCgsd12yrVExSP-wBw"}'::jsonb,
    body := '{"triggered_by":"cron"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'tiktokmine-check-expiring-subscriptions',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jcjycpvapetyihvkblpg.supabase.co/functions/v1/check-expiring-subscriptions',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjanljcHZhcGV0eWlodmtibHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjMxMjIsImV4cCI6MjA4NzY5OTEyMn0.UFG7j4wcW34DxelyKWigC6yV7VCgsd12yrVExSP-wBw"}'::jsonb,
    body := '{"triggered_by":"cron"}'::jsonb
  );
  $$
);

-- =============================================
-- 7. Update get_cron_jobs function
-- =============================================
CREATE OR REPLACE FUNCTION public.get_cron_jobs()
RETURNS TABLE(jobid bigint, jobname text, schedule text, active boolean)
LANGUAGE sql SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jobid, jobname, schedule, active FROM cron.job;
$$;

GRANT EXECUTE ON FUNCTION public.get_cron_jobs() TO authenticated;
