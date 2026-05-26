
-- Add icon_name and prompt_modifier columns to presets table
ALTER TABLE public.presets ADD COLUMN IF NOT EXISTS icon_name text DEFAULT NULL;
ALTER TABLE public.presets ADD COLUMN IF NOT EXISTS prompt_modifier text DEFAULT NULL;
ALTER TABLE public.presets ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Update existing pose presets with icon_name and prompt_modifier
UPDATE public.presets SET icon_name = 'user', prompt_modifier = 'front facing pose, looking at camera' WHERE type = 'pose' AND value = 'front_facing';
UPDATE public.presets SET icon_name = 'smartphone', prompt_modifier = 'selfie pose, holding phone' WHERE type = 'pose' AND value = 'selfie';
UPDATE public.presets SET icon_name = 'eye', prompt_modifier = 'POV angle, first person view holding product' WHERE type = 'pose' AND value = 'pov_holding';
UPDATE public.presets SET icon_name = 'flip-horizontal', prompt_modifier = 'mirror selfie, reflection shot' WHERE type = 'pose' AND value = 'mirror_selfie';
UPDATE public.presets SET icon_name = 'armchair', prompt_modifier = 'sitting relaxed pose' WHERE type = 'pose' AND value = 'sitting';
UPDATE public.presets SET icon_name = 'package', prompt_modifier = 'product only shot, no person, product centered' WHERE type = 'pose' AND value = 'product_only';
UPDATE public.presets SET icon_name = 'heart', prompt_modifier = 'lifestyle casual pose, natural movement' WHERE type = 'pose' AND value = 'lifestyle';
UPDATE public.presets SET icon_name = 'package', prompt_modifier = 'unboxing reaction, opening package' WHERE type = 'pose' AND value = 'unboxing';

-- Update existing style presets
UPDATE public.presets SET icon_name = 'shirt', prompt_modifier = 'casual relaxed everyday outfit, comfortable clothing' WHERE type = 'style' AND value = 'casual';
UPDATE public.presets SET icon_name = 'briefcase', prompt_modifier = 'professional business attire, polished look' WHERE type = 'style' AND value = 'professional';
UPDATE public.presets SET icon_name = 'dumbbell', prompt_modifier = 'athletic sporty outfit, activewear' WHERE type = 'style' AND value = 'sporty';
UPDATE public.presets SET icon_name = 'gem', prompt_modifier = 'elegant sophisticated outfit, high fashion' WHERE type = 'style' AND value = 'elegant';
UPDATE public.presets SET icon_name = 'minimize', prompt_modifier = 'minimalist clean outfit, neutral tones' WHERE type = 'style' AND value = 'minimalist';
UPDATE public.presets SET icon_name = 'layers', prompt_modifier = 'urban streetwear style, trendy street fashion' WHERE type = 'style' AND value = 'streetwear';
UPDATE public.presets SET icon_name = 'leaf', prompt_modifier = 'bohemian free-spirited style, flowing fabrics' WHERE type = 'style' AND value = 'boho';
UPDATE public.presets SET icon_name = 'cloud-sun', prompt_modifier = 'soft pastel tones, gentle aesthetic, dreamy' WHERE type = 'style' AND value = 'soft';
UPDATE public.presets SET icon_name = 'palette', prompt_modifier = 'vibrant colorful outfit, bold colors' WHERE type = 'style' AND value = 'colorful';
UPDATE public.presets SET icon_name = 'sun', prompt_modifier = 'summer outfit, light fabrics, sunny vibes' WHERE type = 'style' AND value = 'summer';
UPDATE public.presets SET icon_name = 'sparkles', prompt_modifier = 'trendy current fashion, latest styles' WHERE type = 'style' AND value = 'trendy';
UPDATE public.presets SET icon_name = 'square', prompt_modifier = 'basic essentials, clean simple outfit' WHERE type = 'style' AND value = 'basic';
UPDATE public.presets SET icon_name = 'heart', prompt_modifier = 'lifestyle content creator look, relatable everyday style' WHERE type = 'style' AND value = 'lifestyle';

-- Update existing enhancement presets
UPDATE public.presets SET icon_name = 'sparkles', prompt_modifier = 'smooth flawless natural skin texture, poreless skin' WHERE type = 'enhancement' AND value = 'skin_enhancer';
UPDATE public.presets SET icon_name = 'sun', prompt_modifier = 'cinematic ambient lighting, golden hour glow' WHERE type = 'enhancement' AND value = 'ambient_light';
UPDATE public.presets SET icon_name = 'eye', prompt_modifier = 'ultra sharp 8K detail, crisp focus' WHERE type = 'enhancement' AND value = 'ultra_sharpness';
UPDATE public.presets SET icon_name = 'shield', prompt_modifier = 'shot on iPhone 15 Pro, natural imperfections, slight grain, authentic photo' WHERE type = 'enhancement' AND value = 'anti_ai';
UPDATE public.presets SET icon_name = 'camera', prompt_modifier = 'professional bokeh f/1.8 depth of field, blurred background' WHERE type = 'enhancement' AND value = 'bokeh_pro';
UPDATE public.presets SET icon_name = 'hand', prompt_modifier = 'anatomically correct natural hands, realistic fingers' WHERE type = 'enhancement' AND value = 'perfect_hands';
UPDATE public.presets SET icon_name = 'scissors', prompt_modifier = 'realistic individual hair strands, natural hair texture' WHERE type = 'enhancement' AND value = 'real_hair';
UPDATE public.presets SET icon_name = 'shirt', prompt_modifier = 'realistic fabric texture and folds, natural cloth draping' WHERE type = 'enhancement' AND value = 'real_fabric';
UPDATE public.presets SET icon_name = 'heart', prompt_modifier = 'natural skin glow, dewy finish, healthy complexion' WHERE type = 'enhancement' AND value = 'natural_glow';

-- Update existing format presets
UPDATE public.presets SET icon_name = 'rectangle-vertical', prompt_modifier = 'portrait_16_9' WHERE type = 'format' AND value = 'vertical';
UPDATE public.presets SET icon_name = 'square', prompt_modifier = 'square' WHERE type = 'format' AND value = 'square';
UPDATE public.presets SET icon_name = 'rectangle-horizontal', prompt_modifier = 'portrait_4_3' WHERE type = 'format' AND value = 'portrait';
UPDATE public.presets SET icon_name = 'monitor', prompt_modifier = 'landscape_16_9' WHERE type = 'format' AND value = 'horizontal';
