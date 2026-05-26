-- Replace all broken storage avatar URLs with ui-avatars fallback
-- This fixes the HEIC files saved as JPEG that browsers can't render
UPDATE viral_creators
SET avatar_url = 'https://ui-avatars.com/api/?name=' || 
  replace(replace(encode(convert_to(COALESCE(display_name, username), 'UTF8'), 'base64'), '+', '-'), '/', '_') ||
  '&background=E01393&color=fff&size=128&bold=true&format=svg'
WHERE avatar_url LIKE '%supabase.co/storage%';