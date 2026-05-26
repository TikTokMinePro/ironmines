
-- Expand viral_products with detailed metrics
ALTER TABLE public.viral_products
  ADD COLUMN IF NOT EXISTS shop_name text,
  ADD COLUMN IF NOT EXISTS shop_logo_url text,
  ADD COLUMN IF NOT EXISTS commission_rate numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS units_sold_today integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS units_sold_7d integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS units_sold_30d integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_today numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_7d numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_30d numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS growth_rate numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rank_position integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rank_change integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS product_url text,
  ADD COLUMN IF NOT EXISTS affiliate_url text,
  ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS creator_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subcategory text,
  ADD COLUMN IF NOT EXISTS trend_data jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'BR';

CREATE INDEX IF NOT EXISTS idx_viral_products_rank ON public.viral_products(rank_position);
CREATE INDEX IF NOT EXISTS idx_viral_products_revenue ON public.viral_products(revenue_today DESC);
