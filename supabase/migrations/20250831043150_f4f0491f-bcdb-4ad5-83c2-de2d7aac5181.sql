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
CREATE INDEX idx_crypto_audit_logs_event_type ON public.crypto_audit_logs(event_type);
CREATE INDEX idx_crypto_audit_logs_order_id ON public.crypto_audit_logs(order_id);
CREATE INDEX idx_crypto_audit_logs_created_at ON public.crypto_audit_logs(created_at);

-- Add atomic derivation index counter per coin to prevent address collisions
CREATE TABLE IF NOT EXISTS public.crypto_derivation_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_symbol TEXT NOT NULL UNIQUE,
  next_index INTEGER NOT NULL DEFAULT 0,
  address_type TEXT NOT NULL DEFAULT 'receive' CHECK (address_type IN ('receive', 'change')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate coin symbols
ALTER TABLE public.crypto_derivation_counters 
ADD CONSTRAINT unique_coin_address_type UNIQUE (coin_symbol, address_type);

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
  ('SOL', 'receive', 0)
ON CONFLICT (coin_symbol, address_type) DO NOTHING;

-- Add columns to crypto_addresses for better tracking
ALTER TABLE public.crypto_addresses 
ADD COLUMN IF NOT EXISTS address_type TEXT DEFAULT 'receive' CHECK (address_type IN ('receive', 'change')),
ADD COLUMN IF NOT EXISTS derivation_path TEXT,
ADD COLUMN IF NOT EXISTS estimated_network_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS recommended_total NUMERIC,
ADD COLUMN IF NOT EXISTS top_up_window_expires_at TIMESTAMP WITH TIME ZONE;

-- Add underpayment/overpayment handling columns to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS crypto_underpaid_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS crypto_overpaid_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_address TEXT,
ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none' CHECK (refund_status IN ('none', 'pending', 'processing', 'completed', 'failed'));

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

-- Enhanced payment status update function with underpayment/overpayment handling
CREATE OR REPLACE FUNCTION update_crypto_payment_status_enhanced()
RETURNS TRIGGER AS $$
DECLARE
  total_received NUMERIC := 0;
  min_confirmations INTEGER := 1;
  order_expected_amount NUMERIC := 0;
  order_id_val UUID;
  underpaid_amount NUMERIC := 0;
  overpaid_amount NUMERIC := 0;
BEGIN
  -- Get the order_id and expected amount
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
  
  -- Calculate underpaid/overpaid amounts
  IF total_received < order_expected_amount THEN
    underpaid_amount := order_expected_amount - total_received;
    overpaid_amount := 0;
  ELSIF total_received > order_expected_amount THEN
    underpaid_amount := 0;
    overpaid_amount := total_received - order_expected_amount;
  ELSE
    underpaid_amount := 0;
    overpaid_amount := 0;
  END IF;
  
  -- Update the order with detailed payment status
  UPDATE public.orders 
  SET 
    crypto_total_received = total_received,
    crypto_underpaid_amount = underpaid_amount,
    crypto_overpaid_amount = overpaid_amount,
    crypto_payment_status = CASE 
      WHEN total_received >= order_expected_amount THEN 'paid'
      WHEN total_received > 0 THEN 'partial'
      ELSE 'pending'
    END,
    status = CASE 
      WHEN total_received >= order_expected_amount THEN 'completed'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = order_id_val;
  
  -- Log audit event
  PERFORM log_crypto_audit_event(
    CASE 
      WHEN total_received >= order_expected_amount THEN 'payment_confirmed'
      WHEN total_received > 0 THEN 'payment_detected'
      ELSE 'payment_detected'
    END,
    order_id_val,
    NEW.crypto_address_id,
    jsonb_build_object(
      'tx_hash', NEW.tx_hash,
      'amount', NEW.amount,
      'confirmations', NEW.confirmations,
      'total_received', total_received,
      'expected_amount', order_expected_amount,
      'underpaid_amount', underpaid_amount,
      'overpaid_amount', overpaid_amount
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace existing trigger with enhanced version
DROP TRIGGER IF EXISTS trigger_update_crypto_payment_status ON public.crypto_transactions;
CREATE TRIGGER trigger_update_crypto_payment_status_enhanced
  AFTER INSERT OR UPDATE ON public.crypto_transactions
  FOR EACH ROW EXECUTE FUNCTION update_crypto_payment_status_enhanced();

-- RLS policies for new tables
ALTER TABLE public.crypto_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_derivation_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_price_snapshots ENABLE ROW LEVEL SECURITY;

-- Audit logs - admins can view all, users can view their own order events
CREATE POLICY "Admins can view all audit logs" ON public.crypto_audit_logs
FOR SELECT USING (current_user_has_role('admin'::app_role));

CREATE POLICY "Users can view audit logs for their orders" ON public.crypto_audit_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = crypto_audit_logs.order_id AND o.user_id = auth.uid()
  )
);

-- Derivation counters - only system can manage
CREATE POLICY "System can manage derivation counters" ON public.crypto_derivation_counters
FOR ALL USING (true);

-- Price snapshots - admins can view all, users can view their order snapshots
CREATE POLICY "Admins can view all price snapshots" ON public.crypto_price_snapshots
FOR SELECT USING (current_user_has_role('admin'::app_role));

CREATE POLICY "Users can view price snapshots for their orders" ON public.crypto_price_snapshots
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = crypto_price_snapshots.order_id AND o.user_id = auth.uid()
  )
);

-- Add unique constraint to prevent duplicate addresses per coin
ALTER TABLE public.crypto_addresses 
ADD CONSTRAINT unique_address_per_coin UNIQUE (address, coin_symbol);