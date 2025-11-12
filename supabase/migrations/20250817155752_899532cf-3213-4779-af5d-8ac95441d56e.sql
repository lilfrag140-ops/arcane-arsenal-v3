-- Clear existing products and insert the 3 new ones
DELETE FROM products;

-- Insert the 3 main products
INSERT INTO products (name, description, price, category, stock_quantity, is_featured, is_active) VALUES
('In-Game Money', 'Custom amount of in-game currency for DonutSMP', 1.00, 'currency', 999999, true, true),
('Skeleton Spawner', 'High-quality skeleton spawners for your base', 5.00, 'spawner', 999999, true, true),
('Elytra', 'Enchanted elytra wings for flight', 10.00, 'item', 999999, true, true);