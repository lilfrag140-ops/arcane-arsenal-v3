-- Add the new products
INSERT INTO products (name, description, price, category, stock_quantity, is_featured, is_active, image_url) VALUES
('Netherite Armor Set', 'Complete enchanted netherite armor set', 1.10, 'item', 75, false, true, 'https://minecraft.wiki/w/File:Enchanted_Netherite_Chestplate_(item).gif'),
('Diamond Armor Set', 'Complete enchanted diamond armor set', 0.30, 'item', 100, false, true, 'https://minecraft.wiki/w/File:Enchanted_Diamond_Chestplate_(item).gif')
ON CONFLICT (name) DO NOTHING;