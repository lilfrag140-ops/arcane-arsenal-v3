-- Fix security issues by properly handling dependencies

-- Drop the trigger first
DROP TRIGGER IF EXISTS trigger_update_crypto_payment_status ON public.crypto_transactions;

-- Drop the function
DROP FUNCTION IF EXISTS public.update_crypto_payment_status();

-- Recreate the function with proper search_path
CREATE OR REPLACE FUNCTION public.update_crypto_payment_status()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
DECLARE
  total_received NUMERIC := 0;
  min_confirmations INTEGER := 1;
  order_expected_amount NUMERIC := 0;
  order_id_val UUID;
BEGIN
  -- Get the order_id from crypto_address
  SELECT ca.order_id, ca.expected_amount, o.crypto_confirmations_required
  INTO order_id_val, order_expected_amount, min_confirmations
  FROM public.crypto_addresses ca
  JOIN public.orders o ON ca.order_id = o.id
  WHERE ca.id = NEW.crypto_address_id;
  
  -- Calculate total confirmed amount for this order across all addresses
  SELECT COALESCE(SUM(ct.amount), 0)
  INTO total_received
  FROM public.crypto_transactions ct
  JOIN public.crypto_addresses ca ON ct.crypto_address_id = ca.id
  WHERE ca.order_id = order_id_val
  AND ct.confirmations >= min_confirmations;
  
  -- Update the order with the total received amount
  UPDATE public.orders 
  SET 
    crypto_total_received = total_received,
    crypto_payment_status = CASE 
      WHEN total_received >= total_amount THEN 'paid'
      WHEN total_received > 0 THEN 'partial'
      ELSE 'pending'
    END,
    status = CASE 
      WHEN total_received >= total_amount THEN 'completed'
      ELSE status
    END,
    updated_at = now()
  WHERE id = order_id_val;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_update_crypto_payment_status
  AFTER INSERT OR UPDATE ON public.crypto_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_crypto_payment_status();

-- Fix the handle_expired_crypto_payments function with proper search_path
DROP FUNCTION IF EXISTS public.handle_expired_crypto_payments();
CREATE OR REPLACE FUNCTION public.handle_expired_crypto_payments()
RETURNS void 
SECURITY DEFINER
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.orders 
  SET 
    crypto_payment_status = 'expired',
    status = 'cancelled',
    updated_at = now()
  WHERE id IN (
    SELECT DISTINCT ca.order_id
    FROM public.crypto_addresses ca
    WHERE ca.expires_at < now()
    AND EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = ca.order_id 
      AND o.crypto_payment_status IN ('pending', 'partial')
    )
  );
END;
$$;