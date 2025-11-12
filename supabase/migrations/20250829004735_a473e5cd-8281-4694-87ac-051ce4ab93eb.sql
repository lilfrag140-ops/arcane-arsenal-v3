-- Create function to handle stock updates after order completion
CREATE OR REPLACE FUNCTION handle_stock_update()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update stock when orders are completed
DROP TRIGGER IF EXISTS trigger_stock_update ON orders;
CREATE TRIGGER trigger_stock_update
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_stock_update();

-- Add constraint to prevent negative stock
ALTER TABLE products 
ADD CONSTRAINT stock_non_negative 
CHECK (stock_quantity >= 0);