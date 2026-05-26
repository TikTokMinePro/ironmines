
-- Add duration and region columns to viral_videos
ALTER TABLE public.viral_videos
ADD COLUMN IF NOT EXISTS duration integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS region text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tiktok_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS creator_username text DEFAULT NULL;
