-- Fix search path security warning by updating existing functions
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.conversations 
  SET updated_at = now() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    discord_id, 
    discord_username, 
    discord_avatar_url,
    username
  )
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'provider_id',
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_tickets_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_stock_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only update stock when order status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update stock quantities for all items in the order
    UPDATE products 
    SET stock_quantity = stock_quantity - order_items.quantity
    FROM order_items
    WHERE products.id = order_items.product_id 
      AND order_items.order_id = NEW.id
      AND products.stock_quantity >= order_items.quantity;
      
    -- Check if any products would go below 0 stock
    IF EXISTS (
      SELECT 1 FROM products p
      INNER JOIN order_items oi ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id 
        AND p.stock_quantity < 0
    ) THEN
      RAISE EXCEPTION 'Insufficient stock for one or more items';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;