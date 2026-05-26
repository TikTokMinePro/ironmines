
-- Deactivate poses not in reference: lifestyle, unboxing
UPDATE public.presets SET is_active = false WHERE type = 'pose' AND value IN ('lifestyle', 'unboxing');

-- Deactivate style not in reference: lifestyle
UPDATE public.presets SET is_active = false WHERE type = 'style' AND value = 'lifestyle';

-- Fix label: POV Holding → POV
UPDATE public.presets SET label = 'POV' WHERE type = 'pose' AND value = 'pov_holding';
