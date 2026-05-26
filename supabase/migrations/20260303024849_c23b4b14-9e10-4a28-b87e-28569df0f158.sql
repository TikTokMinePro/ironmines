
-- Update existing avatars with gender and prompt_base
UPDATE avatars SET gender = 'female', age_range = '20-25', prompt_base = 'young brazilian woman, natural beauty, casual style', ethnicity = 'latina' WHERE name = 'Ana';
UPDATE avatars SET gender = 'male', age_range = '28-35', prompt_base = 'brazilian man, professional look, confident pose', ethnicity = 'latino' WHERE name = 'Carlos';
UPDATE avatars SET gender = 'female', age_range = '25-30', prompt_base = 'brazilian woman, lifestyle influencer, warm smile', ethnicity = 'caucasian' WHERE name = 'Julia';
UPDATE avatars SET gender = 'male', age_range = '20-25', prompt_base = 'young brazilian man, casual streetwear style', ethnicity = 'latino' WHERE name = 'Pedro';
UPDATE avatars SET gender = 'female', age_range = '22-28', prompt_base = 'brazilian woman, elegant and professional, soft features', ethnicity = 'latina' WHERE name = 'Maria';

-- Insert additional avatars for diversity
INSERT INTO avatars (name, image_url, gender, age_range, ethnicity, prompt_base, style_tags, tags, is_active) VALUES
('Bianca', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400', 'female', '18-22', 'afro-brasileira', 'young afro-brazilian woman, vibrant style, confident look', ARRAY['trendy','colorful'], ARRAY['feminino','jovem','trendy'], true),
('Fernanda', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400', 'female', '25-30', 'latina', 'brazilian woman, soft features, natural makeup', ARRAY['minimal','clean'], ARRAY['feminino','adulto','minimal'], true),
('Camila', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400', 'female', '20-25', 'caucasian', 'young caucasian woman, boho style, artistic vibe', ARRAY['boho','artsy'], ARRAY['feminino','jovem','boho'], true),
('Lucas', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', 'male', '22-28', 'caucasian', 'young man, clean shaven, modern style', ARRAY['clean','modern'], ARRAY['masculino','jovem','moderno'], true),
('Rafael', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', 'male', '30-35', 'latino', 'mature brazilian man, beard, professional style', ARRAY['professional','mature'], ARRAY['masculino','adulto','profissional'], true),
('Diego', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400', 'male', '25-30', 'afro-brasileiro', 'afro-brazilian man, sporty style, energetic pose', ARRAY['sporty','urban'], ARRAY['masculino','jovem','esportivo'], true),
('Isabela', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', 'female', '22-26', 'latina', 'young latina woman, streetwear style, urban vibe', ARRAY['streetwear','urban'], ARRAY['feminino','jovem','streetwear'], true);
