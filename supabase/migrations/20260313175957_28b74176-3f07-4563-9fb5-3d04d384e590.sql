-- Restore corrupted avatar image_url for Fernanda and Maria
-- These were overwritten by the face-swap fallback in generate-creative
UPDATE avatars SET image_url = '/avatars/fernanda-reference.jpg' WHERE id = '9765fc0a-211d-4c07-aab8-90798b80df53';
UPDATE avatars SET image_url = '/avatars/maria-reference.jpg' WHERE id = 'e3f63a1a-8c0e-47d9-b1cb-3b40361e1b50';