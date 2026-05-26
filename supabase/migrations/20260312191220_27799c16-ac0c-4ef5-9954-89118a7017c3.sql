-- Add "De Frente" pose (front facing, looking at camera)
INSERT INTO public.poses (name, prompt_modifier, category, is_active)
VALUES ('De Frente', 'front facing pose, standing straight, looking directly at camera, full body or waist up', 'standard', true);

-- Add "Sentada" pose (sitting relaxed)
INSERT INTO public.poses (name, prompt_modifier, category, is_active)
VALUES ('Sentada', 'sitting relaxed pose, comfortable seated position, natural casual sitting', 'standard', true);