
-- Maria: elegant latina, light skin, hazel eyes, straight dark hair, 22-28
UPDATE public.avatars 
SET reference_images = '["https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400"]'::jsonb
WHERE id = 'e3f63a1a-8c0e-47d9-b1cb-3b40361e1b50' AND name = 'Maria';

-- Pedro: young casual latino, olive skin, dark brown eyes, 20-25
UPDATE public.avatars 
SET reference_images = '["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400"]'::jsonb
WHERE id = '905bfb1b-bdf3-4103-b748-2ddb5248b708' AND name = 'Pedro';

-- Rafael: mature latino man with beard, tan skin, professional, 30-35
UPDATE public.avatars 
SET reference_images = '["https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"]'::jsonb
WHERE id = 'f4ec0536-dab7-4409-8f7d-27545e9ddd5f' AND name = 'Rafael';
