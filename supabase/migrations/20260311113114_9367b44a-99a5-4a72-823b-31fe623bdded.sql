-- Seed default plan configuration as JSON in app_settings
INSERT INTO public.app_settings (key, value) VALUES
  ('plan_config', '{"1mes":{"name":"1 Mês","price_cents":6990,"duration_months":1,"discount_label":"","popular":false},"3meses":{"name":"3 Meses","price_cents":18990,"duration_months":3,"discount_label":"9% OFF","popular":true},"6meses":{"name":"6 Meses","price_cents":39990,"duration_months":6,"discount_label":"4% OFF","popular":false}}')
ON CONFLICT (key) DO NOTHING;