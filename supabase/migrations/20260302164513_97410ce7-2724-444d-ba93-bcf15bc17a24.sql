
ALTER TABLE public.viral_videos ADD COLUMN IF NOT EXISTS product_sales integer;
ALTER TABLE public.viral_videos ADD COLUMN IF NOT EXISTS product_revenue numeric;
ALTER TABLE public.viral_videos ADD COLUMN IF NOT EXISTS product_price numeric;
