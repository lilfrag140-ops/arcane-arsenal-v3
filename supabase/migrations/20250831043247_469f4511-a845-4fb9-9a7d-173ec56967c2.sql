-- Drop existing table if it has issues and recreate properly
DROP TABLE IF EXISTS public.crypto_derivation_counters CASCADE;

-- Create audit log table for tracking all crypto payment operations
CREATE TABLE IF NOT EXISTS public.crypto_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('address_generated', 'payment_detected', 'payment_confirmed', 'payment_expired', 'refund_processed', 'underpayment', 'overpayment')),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  crypto_address_id UUID REFERENCES public.crypto_addresses(id) ON DELETE CASCADE,
  event_data JSONB NOT NULL DEFAULT '{}',
  raw_payload JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID DEFAULT auth.uid()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_crypto_audit_logs_event_type ON public.crypto_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_crypto_audit_logs_order_id ON public.crypto_audit_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_crypto_audit_logs_created_at ON public.crypto_audit_logs(created_at);

-- Add atomic derivation index counter per coin to prevent address collisions
CREATE TABLE public.crypto_derivation_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_symbol TEXT NOT NULL,
  address_type TEXT NOT NULL DEFAULT 'receive' CHECK (address_type IN ('receive', 'change')),
  next_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coin_symbol, address_type)
);

-- Initialize counters for supported coins
INSERT INTO public.crypto_derivation_counters (coin_symbol, address_type, next_index) 
VALUES 
  ('BTC', 'receive', 0),
  ('BTC', 'change', 0),
  ('LTC', 'receive', 0),
  ('LTC', 'change', 0),
  ('ETH', 'receive', 0),
  ('USDT', 'receive', 0),
  ('USDC', 'receive', 0),
  ('SOL', 'receive', 0);

-- Add columns to existing tables (use IF NOT EXISTS where possible)
DO $$ 
BEGIN
  -- Add columns to crypto_addresses
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crypto_addresses' AND column_name='address_type') THEN
    ALTER TABLE public.crypto_addresses ADD COLUMN address_type TEXT DEFAULT 'receive' CHECK (address_type IN ('receive', 'change'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crypto_addresses' AND column_name='derivation_path') THEN
    ALTER TABLE public.crypto_addresses ADD COLUMN derivation_path TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crypto_addresses' AND column_name='estimated_network_fee') THEN
    ALTER TABLE public.crypto_addresses ADD COLUMN estimated_network_fee NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crypto_addresses' AND column_name='recommended_total') THEN
    ALTER TABLE public.crypto_addresses ADD COLUMN recommended_total NUMERIC;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crypto_addresses' AND column_name='top_up_window_expires_at') THEN
    ALTER TABLE public.crypto_addresses ADD COLUMN top_up_window_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add columns to orders
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='crypto_underpaid_amount') THEN
    ALTER TABLE public.orders ADD COLUMN crypto_underpaid_amount NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='crypto_overpaid_amount') THEN
    ALTER TABLE public.orders ADD COLUMN crypto_overpaid_amount NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='refund_address') THEN
    ALTER TABLE public.orders ADD COLUMN refund_address TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='refund_status') THEN
    ALTER TABLE public.orders ADD COLUMN refund_status TEXT DEFAULT 'none' CHECK (refund_status IN ('none', 'pending', 'processing', 'completed', 'failed'));
  END IF;
END $$;

-- Add price oracle tracking
CREATE TABLE IF NOT EXISTS public.crypto_price_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_symbol TEXT NOT NULL,
  usd_price NUMERIC NOT NULL,
  price_source TEXT NOT NULL DEFAULT 'coingecko',
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to atomically get next derivation index with row-level locking
CREATE OR REPLACE FUNCTION get_next_derivation_index(p_coin_symbol TEXT, p_address_type TEXT DEFAULT 'receive')
RETURNS INTEGER AS $$
DECLARE
  next_idx INTEGER;
BEGIN
  -- Use SELECT FOR UPDATE to ensure atomic operation
  SELECT next_index INTO next_idx
  FROM public.crypto_derivation_counters
  WHERE coin_symbol = p_coin_symbol AND address_type = p_address_type
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- Initialize if not exists
    INSERT INTO public.crypto_derivation_counters (coin_symbol, address_type, next_index)
    VALUES (p_coin_symbol, p_address_type, 1)
    RETURNING next_index INTO next_idx;
    RETURN 0;
  END IF;
  
  -- Increment counter
  UPDATE public.crypto_derivation_counters
  SET next_index = next_index + 1,
      updated_at = NOW()
  WHERE coin_symbol = p_coin_symbol AND address_type = p_address_type;
  
  RETURN next_idx;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log crypto audit events
CREATE OR REPLACE FUNCTION log_crypto_audit_event(
  p_event_type TEXT,
  p_order_id UUID DEFAULT NULL,
  p_crypto_address_id UUID DEFAULT NULL,
  p_event_data JSONB DEFAULT '{}',
  p_raw_payload JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.crypto_audit_logs (
    event_type,
    order_id,
    crypto_address_id,
    event_data,
    raw_payload,
    created_by
  ) VALUES (
    p_event_type,
    p_order_id,
    p_crypto_address_id,
    p_event_data,
    p_raw_payload,
    auth.uid()
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;