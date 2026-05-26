
-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE public.app_plan AS ENUM ('basic', 'pro', 'agency');
CREATE TYPE public.subscription_status AS ENUM ('active', 'trial', 'expired', 'cancelled');
CREATE TYPE public.alert_type AS ENUM ('new_viral_product', 'score_threshold', 'position_change', 'new_viral_video');
CREATE TYPE public.alert_channel AS ENUM ('email', 'webhook');
CREATE TYPE public.trend_direction AS ENUM ('up', 'down', 'stable');
CREATE TYPE public.preset_type AS ENUM ('pose', 'environment', 'style');
CREATE TYPE public.job_type AS ENUM ('products', 'videos', 'creators');
CREATE TYPE public.job_status AS ENUM ('pending', 'running', 'done', 'error');
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- =============================================
-- TABLES
-- =============================================

-- 1. profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  plan app_plan NOT NULL DEFAULT 'basic',
  subscription_status subscription_status NOT NULL DEFAULT 'trial',
  subscription_expires_at TIMESTAMPTZ,
  creatives_used_this_month INT NOT NULL DEFAULT 0,
  alerts_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. user_roles (security best practice - separate table)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. viral_products
CREATE TABLE public.viral_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT,
  price NUMERIC(10,2),
  image_url TEXT,
  viral_score FLOAT DEFAULT 0,
  trend_direction trend_direction DEFAULT 'stable',
  views BIGINT DEFAULT 0,
  sales BIGINT DEFAULT 0,
  engagement_rate FLOAT DEFAULT 0,
  source_url TEXT,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  is_blacklisted BOOLEAN DEFAULT false,
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.viral_products ENABLE ROW LEVEL SECURITY;

-- 4. viral_creators
CREATE TABLE public.viral_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  followers BIGINT DEFAULT 0,
  avg_views BIGINT DEFAULT 0,
  engagement_rate FLOAT DEFAULT 0,
  niche TEXT,
  profile_url TEXT,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.viral_creators ENABLE ROW LEVEL SECURITY;

-- 5. viral_videos
CREATE TABLE public.viral_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.viral_products(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES public.viral_creators(id) ON DELETE SET NULL,
  video_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  shares BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  viral_score FLOAT DEFAULT 0,
  category TEXT,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.viral_videos ENABLE ROW LEVEL SECURITY;

-- 6. user_alerts
CREATE TABLE public.user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  alert_type alert_type NOT NULL,
  category TEXT,
  score_threshold FLOAT,
  niche TEXT,
  channel alert_channel NOT NULL DEFAULT 'email',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

-- 7. alert_history
CREATE TABLE public.alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.user_alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  product_id UUID REFERENCES public.viral_products(id) ON DELETE SET NULL,
  video_id UUID REFERENCES public.viral_videos(id) ON DELETE SET NULL
);
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

-- 8. user_creatives
CREATE TABLE public.user_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.viral_products(id) ON DELETE SET NULL,
  image_url TEXT,
  avatar_used TEXT,
  pose TEXT,
  environment TEXT,
  style TEXT,
  prompt_used TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_creatives ENABLE ROW LEVEL SECURITY;

-- 9. avatars (admin managed)
CREATE TABLE public.avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;

-- 10. presets
CREATE TABLE public.presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type preset_type NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;

-- 11. subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan app_plan NOT NULL,
  ironpay_order_id TEXT,
  ironpay_subscription_id TEXT,
  status subscription_status NOT NULL DEFAULT 'active',
  amount NUMERIC(10,2),
  currency TEXT DEFAULT 'BRL',
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 12. mining_jobs
CREATE TABLE public.mining_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type job_type NOT NULL,
  status job_status NOT NULL DEFAULT 'pending',
  records_fetched INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mining_jobs ENABLE ROW LEVEL SECURITY;

-- 13. plan_limits
CREATE TABLE public.plan_limits (
  plan app_plan PRIMARY KEY,
  creatives_per_month INT NOT NULL,
  alerts_max INT NOT NULL,
  has_webhook BOOLEAN NOT NULL DEFAULT false,
  has_agency_features BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- profiles: users see/edit own data, admins see all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- user_roles: only admins can manage, users can read own
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- viral_products: all authenticated users can read, admins can write
CREATE POLICY "Authenticated users can view products" ON public.viral_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage products" ON public.viral_products FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- viral_videos: all authenticated can read
CREATE POLICY "Authenticated users can view videos" ON public.viral_videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage videos" ON public.viral_videos FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- viral_creators: all authenticated can read
CREATE POLICY "Authenticated users can view creators" ON public.viral_creators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage creators" ON public.viral_creators FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- user_alerts: users manage own
CREATE POLICY "Users can view own alerts" ON public.user_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON public.user_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.user_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON public.user_alerts FOR DELETE USING (auth.uid() = user_id);

-- alert_history: users see own
CREATE POLICY "Users can view own alert history" ON public.alert_history FOR SELECT USING (auth.uid() = user_id);

-- user_creatives: users manage own
CREATE POLICY "Users can view own creatives" ON public.user_creatives FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own creatives" ON public.user_creatives FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own creatives" ON public.user_creatives FOR DELETE USING (auth.uid() = user_id);

-- avatars: all authenticated can read active
CREATE POLICY "Users can view active avatars" ON public.avatars FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage avatars" ON public.avatars FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- presets: all authenticated can read active
CREATE POLICY "Users can view active presets" ON public.presets FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage presets" ON public.presets FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- subscriptions: users see own, admins see all
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- mining_jobs: admins only
CREATE POLICY "Admins can view mining jobs" ON public.mining_jobs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage mining jobs" ON public.mining_jobs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- plan_limits: all authenticated can read
CREATE POLICY "Anyone can view plan limits" ON public.plan_limits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage plan limits" ON public.plan_limits FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SEED DATA
-- =============================================

-- Plan limits
INSERT INTO public.plan_limits (plan, creatives_per_month, alerts_max, has_webhook, has_agency_features) VALUES
  ('basic', 30, 3, false, false),
  ('pro', 150, 15, false, false),
  ('agency', 500, 999999, true, true);

-- Default presets
INSERT INTO public.presets (type, label, value) VALUES
  ('pose', 'Selfie', 'selfie'),
  ('pose', 'Mirror Selfie', 'mirror_selfie'),
  ('pose', 'POV Holding', 'pov_holding'),
  ('pose', 'Lifestyle', 'lifestyle'),
  ('pose', 'Unboxing', 'unboxing'),
  ('environment', 'Casa', 'home'),
  ('environment', 'Estúdio', 'studio'),
  ('environment', 'Exterior', 'outdoor'),
  ('environment', 'Neutro', 'neutral'),
  ('environment', 'Loja', 'store'),
  ('style', 'Casual', 'casual'),
  ('style', 'Profissional', 'professional'),
  ('style', 'Lifestyle', 'lifestyle');

-- Default avatars (placeholder)
INSERT INTO public.avatars (name, image_url, tags) VALUES
  ('Ana', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400', ARRAY['feminino', 'jovem', 'casual']),
  ('Carlos', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', ARRAY['masculino', 'adulto', 'profissional']),
  ('Julia', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', ARRAY['feminino', 'adulto', 'lifestyle']),
  ('Pedro', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', ARRAY['masculino', 'jovem', 'casual']),
  ('Maria', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', ARRAY['feminino', 'jovem', 'profissional']);

-- Mock viral products
INSERT INTO public.viral_products (title, category, price, image_url, viral_score, trend_direction, views, sales, engagement_rate, source_url) VALUES
  ('Creme Hidratante Glow', 'Beleza', 49.90, 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400', 95.2, 'up', 2500000, 15000, 8.5, 'https://tiktok.com/shop'),
  ('Fone Bluetooth TWS', 'Eletrônicos', 79.90, 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400', 88.7, 'up', 1800000, 12000, 7.2, 'https://tiktok.com/shop'),
  ('Organizador de Maquiagem', 'Casa', 39.90, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', 82.1, 'stable', 950000, 8000, 6.8, 'https://tiktok.com/shop'),
  ('Garrafa Térmica Smart', 'Fitness', 89.90, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400', 79.5, 'up', 1200000, 9500, 7.0, 'https://tiktok.com/shop'),
  ('Ring Light Profissional', 'Tech', 129.90, 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=400', 76.3, 'down', 800000, 6000, 5.5, 'https://tiktok.com/shop'),
  ('Kit Skincare Coreano', 'Beleza', 159.90, 'https://images.unsplash.com/photo-1570194065650-d99fb4b38b17?w=400', 91.0, 'up', 3200000, 18000, 9.1, 'https://tiktok.com/shop'),
  ('Bolsa Crossbody Mini', 'Moda', 69.90, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400', 74.8, 'stable', 650000, 5500, 6.0, 'https://tiktok.com/shop'),
  ('Luminária LED Sunset', 'Decoração', 59.90, 'https://images.unsplash.com/photo-1507908708918-778587c9e563?w=400', 85.4, 'up', 1500000, 11000, 7.8, 'https://tiktok.com/shop'),
  ('Protetor Solar Facial', 'Beleza', 45.90, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', 70.2, 'down', 500000, 4000, 5.2, 'https://tiktok.com/shop'),
  ('Tapete de Yoga Premium', 'Fitness', 99.90, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', 68.9, 'stable', 420000, 3500, 4.8, 'https://tiktok.com/shop');

-- Storage bucket for creatives
INSERT INTO storage.buckets (id, name, public) VALUES ('creatives', 'creatives', true);

-- Storage policies
CREATE POLICY "Users can upload own creatives" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'creatives' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own creatives" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'creatives' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own creatives" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'creatives' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view creatives" ON storage.objects FOR SELECT
  USING (bucket_id = 'creatives');
