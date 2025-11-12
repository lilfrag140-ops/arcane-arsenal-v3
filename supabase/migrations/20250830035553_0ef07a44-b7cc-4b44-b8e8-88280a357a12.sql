-- Update all products with the correct image URLs
UPDATE products SET image_url = 'https://nkjosjigixkhkgadizqr.supabase.co/storage/v1/object/public/static/money_9063314.png' 
WHERE name = 'Money' OR name ILIKE '%money%' OR category = 'currency';

UPDATE products SET image_url = 'https://nkjosjigixkhkgadizqr.supabase.co/storage/v1/object/public/static/skelly.png' 
WHERE name ILIKE '%skeleton%' OR name ILIKE '%spawner%';

UPDATE products SET image_url = '/assets/elytra-03xwt-VA.gif' 
WHERE name ILIKE '%elytra%';

UPDATE products SET image_url = 'https://nkjosjigixkhkgadizqr.supabase.co/storage/v1/object/public/static/diamond_chestplate.png' 
WHERE name ILIKE '%diamond%armor%';

UPDATE products SET image_url = 'https://nkjosjigixkhkgadizqr.supabase.co/storage/v1/object/public/static/netherite_chestplate.png' 
WHERE name ILIKE '%netherite%armor%';