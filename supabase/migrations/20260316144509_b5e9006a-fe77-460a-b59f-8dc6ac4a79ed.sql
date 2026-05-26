
-- Populate wardrobe_defaults for avatars that are missing it

UPDATE avatars SET wardrobe_defaults = '{"style": "smart_casual", "colors": ["navy", "white", "charcoal", "olive"], "accessories": ["watch"]}'::jsonb WHERE name = 'Carlos';

UPDATE avatars SET wardrobe_defaults = '{"style": "sporty_casual", "colors": ["black", "gray", "neon_accents", "white"], "accessories": ["sports_watch", "sneakers"]}'::jsonb WHERE name = 'Diego';

UPDATE avatars SET wardrobe_defaults = '{"style": "romantic_feminine", "colors": ["pastel_pink", "white", "lavender", "soft_blue"], "accessories": ["delicate_ring", "small_pendant"]}'::jsonb WHERE name = 'Fernanda';

UPDATE avatars SET wardrobe_defaults = '{"style": "urban_trendy", "colors": ["black", "red", "denim_blue", "white"], "accessories": ["chunky_rings", "hoop_earrings", "chain_necklace"]}'::jsonb WHERE name = 'Isabela';

UPDATE avatars SET wardrobe_defaults = '{"style": "modern_minimal", "colors": ["white", "beige", "light_gray", "black"], "accessories": ["minimal_watch"]}'::jsonb WHERE name = 'Lucas';

UPDATE avatars SET wardrobe_defaults = '{"style": "streetwear", "colors": ["black", "white", "gray", "earth_tones"], "accessories": ["cap", "chain_necklace"]}'::jsonb WHERE name = 'Pedro';

UPDATE avatars SET wardrobe_defaults = '{"style": "classic_professional", "colors": ["navy", "burgundy", "charcoal", "white"], "accessories": ["classic_watch", "leather_belt"]}'::jsonb WHERE name = 'Rafael';
