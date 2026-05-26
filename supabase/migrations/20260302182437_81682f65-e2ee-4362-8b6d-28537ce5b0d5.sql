
-- 1. Expand avatars table
ALTER TABLE public.avatars 
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS age_range text,
  ADD COLUMN IF NOT EXISTS ethnicity text,
  ADD COLUMN IF NOT EXISTS style_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS prompt_base text;

-- 2. Create poses table
CREATE TABLE public.poses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text,
  prompt_modifier text NOT NULL,
  category text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.poses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active poses" ON public.poses
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage poses" ON public.poses
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 3. Create scenarios table
CREATE TABLE public.scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text,
  prompt_modifier text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active scenarios" ON public.scenarios
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage scenarios" ON public.scenarios
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 4. Expand user_creatives
ALTER TABLE public.user_creatives
  ADD COLUMN IF NOT EXISTS veo_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS veo_video_url text,
  ADD COLUMN IF NOT EXISTS pose_id uuid REFERENCES public.poses(id),
  ADD COLUMN IF NOT EXISTS scenario_id uuid REFERENCES public.scenarios(id);

-- 5. Create veo_jobs table
CREATE TABLE public.veo_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id uuid REFERENCES public.user_creatives(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  prompt text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  video_url text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.veo_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own veo jobs" ON public.veo_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own veo jobs" ON public.veo_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage veo jobs" ON public.veo_jobs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 6. Seed poses
INSERT INTO public.poses (name, prompt_modifier, category) VALUES
  ('Selfie Natural', 'natural selfie holding product close to face', 'selfie'),
  ('Mirror Selfie', 'mirror selfie showing product in reflection', 'mirror'),
  ('POV Unboxing', 'POV angle opening product box, hands visible', 'pov'),
  ('Lifestyle Casual', 'casually using product in daily routine', 'lifestyle'),
  ('Unboxing Reaction', 'excited unboxing reaction holding product', 'unboxing'),
  ('Product Close-up', 'close-up product showcase with hands', 'closeup'),
  ('Before & After', 'before and after comparison with product', 'comparison'),
  ('Outfit of the Day', 'full body OOTD style showing product', 'ootd');

-- 7. Seed scenarios
INSERT INTO public.scenarios (name, prompt_modifier) VALUES
  ('Quarto Moderno', 'modern bedroom with soft natural light from window'),
  ('Rua Urbana', 'urban street background with city vibes'),
  ('Loja Trendy', 'trendy store interior with shelves and products'),
  ('Praia Tropical', 'tropical beach background with palm trees and sand'),
  ('Estúdio Clean', 'clean white studio background with soft lighting'),
  ('Neutro Minimalista', 'neutral minimalist background soft gradient');
