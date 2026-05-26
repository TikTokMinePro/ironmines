
-- Create avatars storage bucket for publicly accessible avatar reference images
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read avatar images
CREATE POLICY "Anyone can view avatar images"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow admins to manage avatar images
CREATE POLICY "Admins can manage avatar images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'avatars' AND (SELECT public.has_role(auth.uid(), 'admin')))
WITH CHECK (bucket_id = 'avatars' AND (SELECT public.has_role(auth.uid(), 'admin')));
