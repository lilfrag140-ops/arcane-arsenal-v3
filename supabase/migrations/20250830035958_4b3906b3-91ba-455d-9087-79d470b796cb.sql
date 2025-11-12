-- Update specific products with the new gif URLs
UPDATE products SET image_url = 'https://nkjosjigixkhkgadizqr.supabase.co/storage/v1/object/public/static/elytra.gif' 
WHERE name ILIKE '%elytra%';

UPDATE products SET image_url = 'https://nkjosjigixkhkgadizqr.supabase.co/storage/v1/object/public/static/diamond-armor.gif' 
WHERE name ILIKE '%diamond%armor%';

UPDATE products SET image_url = 'https://nkjosjigixkhkgadizqr.supabase.co/storage/v1/object/public/static/netherite-armor.gif' 
WHERE name ILIKE '%netherite%armor%';