-- Create a proper stocks table for better stock management
CREATE TABLE IF NOT EXISTS public.stocks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer DEFAULT 10,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

-- Enable RLS on stocks table
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;

-- Create policies for stocks table
CREATE POLICY "Everyone can view stocks" ON public.stocks FOR SELECT USING (true);
CREATE POLICY "Admins can manage all stocks" ON public.stocks FOR ALL USING (current_user_has_role('admin'::app_role));

-- Add admin capabilities to ticket system
ALTER TABLE ticket_messages ADD COLUMN IF NOT EXISTS admin_user_id uuid;

-- Create policies for admin ticket management
CREATE POLICY "Admins can view all tickets" ON public.tickets FOR SELECT USING (current_user_has_role('admin'::app_role));
CREATE POLICY "Admins can update all tickets" ON public.tickets FOR UPDATE USING (current_user_has_role('admin'::app_role));
CREATE POLICY "Admins can view all ticket messages" ON public.ticket_messages FOR SELECT USING (current_user_has_role('admin'::app_role));
CREATE POLICY "Admins can create ticket messages" ON public.ticket_messages FOR INSERT WITH CHECK (current_user_has_role('admin'::app_role));

-- Add the new products with correct ordering
INSERT INTO products (name, description, price, category, stock_quantity, is_featured, is_active, image_url) VALUES
('In-Game Money', 'Get instant Minecraft currency delivered to your account', 0.50, 'currency', 1000, true, true, null),
('Skeleton Spawner', 'High-quality skeleton spawner for your builds', 2.50, 'spawner', 50, true, true, null),
('Elytra', 'Rare elytra wings for flight in Minecraft', 5.00, 'item', 25, true, true, null),
('Netherite Armor Set', 'Complete enchanted netherite armor set', 1.10, 'item', 75, false, true, 'https://minecraft.wiki/w/File:Enchanted_Netherite_Chestplate_(item).gif'),
('Diamond Armor Set', 'Complete enchanted diamond armor set', 0.30, 'item', 100, false, true, 'https://minecraft.wiki/w/File:Enchanted_Diamond_Chestplate_(item).gif');