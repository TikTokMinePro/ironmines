
-- Remove FK constraint from viral_videos.product_id
ALTER TABLE public.viral_videos DROP CONSTRAINT IF EXISTS viral_videos_product_id_fkey;

-- Drop the product_id column
ALTER TABLE public.viral_videos DROP COLUMN IF EXISTS product_id;

-- Add new columns for independent product data from TikTok Shop
ALTER TABLE public.viral_videos ADD COLUMN IF NOT EXISTS product_title text;
ALTER TABLE public.viral_videos ADD COLUMN IF NOT EXISTS product_image_url text;
ALTER TABLE public.viral_videos ADD COLUMN IF NOT EXISTS product_shop_url text;
