
-- Add tracking columns to viral_products
ALTER TABLE public.viral_products 
  ADD COLUMN IF NOT EXISTS viral_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_seen_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS product_id_external text;

-- Add tracking columns to viral_videos
ALTER TABLE public.viral_videos 
  ADD COLUMN IF NOT EXISTS viral_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_seen_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS sales_estimated numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_estimated numeric DEFAULT 0;

-- Add tracking columns to viral_creators
ALTER TABLE public.viral_creators 
  ADD COLUMN IF NOT EXISTS viral_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_seen_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS total_sales_estimated numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_revenue_estimated numeric DEFAULT 0;

-- Create mining_runs table for run history
CREATE TABLE IF NOT EXISTS public.mining_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date timestamptz NOT NULL DEFAULT now(),
  products_fetched integer DEFAULT 0,
  videos_fetched integer DEFAULT 0,
  creators_fetched integer DEFAULT 0,
  status text NOT NULL DEFAULT 'running',
  error_message text,
  duration_ms integer,
  finished_at timestamptz
);

ALTER TABLE public.mining_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage mining_runs" ON public.mining_runs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view mining_runs" ON public.mining_runs
  FOR SELECT TO authenticated
  USING (true);

-- Create unique indexes for upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS idx_viral_products_title_shop 
  ON public.viral_products (title, shop_name) WHERE shop_name IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_viral_videos_tiktok_id 
  ON public.viral_videos (tiktok_id) WHERE tiktok_id IS NOT NULL AND tiktok_id != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_viral_creators_username 
  ON public.viral_creators (username);

-- Backfill first_seen_at from created_at for existing records
UPDATE public.viral_products SET first_seen_at = created_at WHERE first_seen_at IS NULL OR first_seen_at = now();
UPDATE public.viral_videos SET first_seen_at = created_at WHERE first_seen_at IS NULL OR first_seen_at = now();
UPDATE public.viral_creators SET first_seen_at = created_at WHERE first_seen_at IS NULL OR first_seen_at = now();
