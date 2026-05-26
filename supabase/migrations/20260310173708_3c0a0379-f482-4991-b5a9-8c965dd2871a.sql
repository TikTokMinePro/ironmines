
-- ============================================================
-- FIX: Recreate ALL 44 RLS policies as PERMISSIVE (default)
-- Currently all are RESTRICTIVE which blocks all client access
-- ============================================================

-- ==================== app_settings ====================
DROP POLICY IF EXISTS "Admins can manage settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated can read settings" ON public.app_settings;

CREATE POLICY "Admins can manage settings" ON public.app_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can read settings" ON public.app_settings FOR SELECT TO authenticated USING (true);

-- ==================== avatars ====================
DROP POLICY IF EXISTS "Admins can manage avatars" ON public.avatars;
DROP POLICY IF EXISTS "Users can view active avatars" ON public.avatars;

CREATE POLICY "Admins can manage avatars" ON public.avatars FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view active avatars" ON public.avatars FOR SELECT TO authenticated USING (is_active = true);

-- ==================== coupons ====================
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated can read active coupons" ON public.coupons;

CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can read active coupons" ON public.coupons FOR SELECT TO authenticated USING (is_active = true);

-- ==================== email_templates ====================
DROP POLICY IF EXISTS "Admins can manage email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Authenticated can view active templates" ON public.email_templates;

CREATE POLICY "Admins can manage email templates" ON public.email_templates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view active templates" ON public.email_templates FOR SELECT TO authenticated USING (is_active = true);

-- ==================== influencer_generations ====================
DROP POLICY IF EXISTS "Admins can manage generations" ON public.influencer_generations;
DROP POLICY IF EXISTS "Users can insert own generations" ON public.influencer_generations;
DROP POLICY IF EXISTS "Users can view own generations" ON public.influencer_generations;

CREATE POLICY "Admins can manage generations" ON public.influencer_generations FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own generations" ON public.influencer_generations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own generations" ON public.influencer_generations FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ==================== mining_jobs ====================
DROP POLICY IF EXISTS "Admins can manage mining jobs" ON public.mining_jobs;
DROP POLICY IF EXISTS "Admins can view mining jobs" ON public.mining_jobs;

CREATE POLICY "Admins can manage mining jobs" ON public.mining_jobs FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view mining jobs" ON public.mining_jobs FOR SELECT TO authenticated USING (true);

-- ==================== mining_runs ====================
DROP POLICY IF EXISTS "Admins can manage mining_runs" ON public.mining_runs;
DROP POLICY IF EXISTS "Authenticated can view mining_runs" ON public.mining_runs;

CREATE POLICY "Admins can manage mining_runs" ON public.mining_runs FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view mining_runs" ON public.mining_runs FOR SELECT TO authenticated USING (true);

-- ==================== poses ====================
DROP POLICY IF EXISTS "Admins can manage poses" ON public.poses;
DROP POLICY IF EXISTS "Users can view active poses" ON public.poses;

CREATE POLICY "Admins can manage poses" ON public.poses FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view active poses" ON public.poses FOR SELECT TO authenticated USING (is_active = true);

-- ==================== presets ====================
DROP POLICY IF EXISTS "Admins can manage presets" ON public.presets;
DROP POLICY IF EXISTS "Users can view active presets" ON public.presets;

CREATE POLICY "Admins can manage presets" ON public.presets FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view active presets" ON public.presets FOR SELECT TO authenticated USING (is_active = true);

-- ==================== product_variants ====================
DROP POLICY IF EXISTS "Admins can manage variants" ON public.product_variants;
DROP POLICY IF EXISTS "Authenticated can view variants" ON public.product_variants;

CREATE POLICY "Admins can manage variants" ON public.product_variants FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view variants" ON public.product_variants FOR SELECT TO authenticated USING (true);

-- ==================== profiles ====================
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- ==================== scenarios ====================
DROP POLICY IF EXISTS "Admins can manage scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can view active scenarios" ON public.scenarios;

CREATE POLICY "Admins can manage scenarios" ON public.scenarios FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view active scenarios" ON public.scenarios FOR SELECT TO authenticated USING (is_active = true);

-- ==================== subscriptions ====================
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;

CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ==================== user_creatives ====================
DROP POLICY IF EXISTS "Users can delete own creatives" ON public.user_creatives;
DROP POLICY IF EXISTS "Users can insert own creatives" ON public.user_creatives;
DROP POLICY IF EXISTS "Users can view own creatives" ON public.user_creatives;

CREATE POLICY "Users can delete own creatives" ON public.user_creatives FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own creatives" ON public.user_creatives FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own creatives" ON public.user_creatives FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ==================== user_roles ====================
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ==================== veo_jobs ====================
DROP POLICY IF EXISTS "Admins can manage veo jobs" ON public.veo_jobs;
DROP POLICY IF EXISTS "Users can insert own veo jobs" ON public.veo_jobs;
DROP POLICY IF EXISTS "Users can view own veo jobs" ON public.veo_jobs;

CREATE POLICY "Admins can manage veo jobs" ON public.veo_jobs FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own veo jobs" ON public.veo_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own veo jobs" ON public.veo_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ==================== viral_creators ====================
DROP POLICY IF EXISTS "Admins can manage creators" ON public.viral_creators;
DROP POLICY IF EXISTS "Authenticated users can view creators" ON public.viral_creators;

CREATE POLICY "Admins can manage creators" ON public.viral_creators FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view creators" ON public.viral_creators FOR SELECT TO authenticated USING (true);

-- ==================== viral_products ====================
DROP POLICY IF EXISTS "Admins can manage products" ON public.viral_products;
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.viral_products;

CREATE POLICY "Admins can manage products" ON public.viral_products FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view products" ON public.viral_products FOR SELECT TO authenticated USING (true);

-- ==================== viral_videos ====================
DROP POLICY IF EXISTS "Admins can manage videos" ON public.viral_videos;
DROP POLICY IF EXISTS "Authenticated users can view videos" ON public.viral_videos;

CREATE POLICY "Admins can manage videos" ON public.viral_videos FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view videos" ON public.viral_videos FOR SELECT TO authenticated USING (true);
