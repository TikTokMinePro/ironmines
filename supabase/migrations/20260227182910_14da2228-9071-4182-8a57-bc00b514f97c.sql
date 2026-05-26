-- Remove alert-related tables
DROP TABLE IF EXISTS public.alert_history CASCADE;
DROP TABLE IF EXISTS public.user_alerts CASCADE;

-- Remove alert-related enum type
DROP TYPE IF EXISTS public.alert_channel CASCADE;
DROP TYPE IF EXISTS public.alert_type CASCADE;