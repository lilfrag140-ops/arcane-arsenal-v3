-- Create crypto payment addresses table
CREATE TABLE public.crypto_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  coin_symbol TEXT NOT NULL, -- BTC, ETH, LTC, SOL, USDT, USDC
  network TEXT NOT NULL, -- mainnet, testnet
  address TEXT NOT NULL,
  derivation_index INTEGER NOT NULL,
  expected_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  
  CONSTRAINT fk_crypto_addresses_order_id FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT unique_address_per_coin UNIQUE (address, coin_symbol)
);

-- Create crypto transactions table to track blockchain confirmations
CREATE TABLE public.crypto_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crypto_address_id UUID NOT NULL,
  tx_hash TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  confirmations INTEGER NOT NULL DEFAULT 0,
  block_height INTEGER,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT fk_crypto_transactions_address FOREIGN KEY (crypto_address_id) REFERENCES public.crypto_addresses(id) ON DELETE CASCADE,
  CONSTRAINT unique_tx_hash_per_address UNIQUE (crypto_address_id, tx_hash)
);

-- Add crypto payment status to orders table
ALTER TABLE public.orders ADD COLUMN crypto_payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN crypto_total_received NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN crypto_confirmations_required INTEGER DEFAULT 1;

-- Create indexes for better performance
CREATE INDEX idx_crypto_addresses_order_id ON public.crypto_addresses(order_id);
CREATE INDEX idx_crypto_addresses_address ON public.crypto_addresses(address);
CREATE INDEX idx_crypto_addresses_expires_at ON public.crypto_addresses(expires_at);
CREATE INDEX idx_crypto_transactions_address_id ON public.crypto_transactions(crypto_address_id);
CREATE INDEX idx_crypto_transactions_confirmations ON public.crypto_transactions(confirmations);

-- Enable RLS
ALTER TABLE public.crypto_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for crypto_addresses
CREATE POLICY "Users can view their own crypto addresses" 
ON public.crypto_addresses 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.orders 
  WHERE orders.id = crypto_addresses.order_id 
  AND orders.user_id = auth.uid()
));

CREATE POLICY "System can manage crypto addresses" 
ON public.crypto_addresses 
FOR ALL 
USING (true);

-- RLS policies for crypto_transactions
CREATE POLICY "Users can view transactions for their addresses" 
ON public.crypto_transactions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.crypto_addresses ca
  JOIN public.orders o ON ca.order_id = o.id
  WHERE ca.id = crypto_transactions.crypto_address_id 
  AND o.user_id = auth.uid()
));

CREATE POLICY "System can manage crypto transactions" 
ON public.crypto_transactions 
FOR ALL 
USING (true);

-- Function to update order crypto payment status
CREATE OR REPLACE FUNCTION public.update_crypto_payment_status()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update payment status when transactions are added/updated
CREATE TRIGGER trigger_update_crypto_payment_status
  AFTER INSERT OR UPDATE ON public.crypto_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_crypto_payment_status();

-- Function to handle expired crypto payments
CREATE OR REPLACE FUNCTION public.handle_expired_crypto_payments()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;