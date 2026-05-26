UPDATE viral_creators 
SET avatar_url = 'https://ui-avatars.com/api/?name=' || 
  REPLACE(COALESCE(display_name, username), ' ', '+') || 
  '&background=E01393&color=fff&size=128&bold=true&format=svg'
WHERE avatar_url LIKE '%ui-avatars.com%';