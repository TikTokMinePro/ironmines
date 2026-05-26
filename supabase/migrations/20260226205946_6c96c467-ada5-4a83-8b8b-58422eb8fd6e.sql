
-- Add new columns to mining_jobs
ALTER TABLE public.mining_jobs ADD COLUMN IF NOT EXISTS triggered_by text DEFAULT 'cron';
ALTER TABLE public.mining_jobs ADD COLUMN IF NOT EXISTS duration_ms integer;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_mining_jobs_started ON public.mining_jobs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_mining_jobs_status ON public.mining_jobs(status);
