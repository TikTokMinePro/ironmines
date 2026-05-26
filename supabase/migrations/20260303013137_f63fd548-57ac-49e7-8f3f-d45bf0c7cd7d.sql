
-- Add enhancement and format to preset_type enum
ALTER TYPE public.preset_type ADD VALUE IF NOT EXISTS 'enhancement';
ALTER TYPE public.preset_type ADD VALUE IF NOT EXISTS 'format';

-- Add new columns to user_creatives for the expanded flow
ALTER TABLE public.user_creatives 
  ADD COLUMN IF NOT EXISTS custom_pose_text text,
  ADD COLUMN IF NOT EXISTS custom_scenario_text text,
  ADD COLUMN IF NOT EXISTS additional_info text,
  ADD COLUMN IF NOT EXISTS format text DEFAULT 'vertical',
  ADD COLUMN IF NOT EXISTS enhancements text[] DEFAULT '{}';
