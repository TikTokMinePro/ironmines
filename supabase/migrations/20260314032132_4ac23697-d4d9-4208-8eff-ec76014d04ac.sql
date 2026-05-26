-- Allow authenticated users to read specific checkout/plan settings
-- Plans page needs these to show checkout links for expired users
CREATE POLICY "Authenticated can read plan settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (
  key IN ('checkout_url_1m', 'checkout_url_3m', 'checkout_url_6m', 'plan_config')
);