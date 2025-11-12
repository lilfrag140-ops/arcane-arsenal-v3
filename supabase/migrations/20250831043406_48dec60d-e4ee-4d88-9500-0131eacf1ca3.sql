-- Fix security issues: Enable RLS on new tables and set proper search paths

-- Enable RLS on all new tables
ALTER TABLE public.crypto_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_derivation_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_price_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for crypto_audit_logs
CREATE POLICY "Admins can view all audit logs" ON public.crypto_audit_logs
FOR SELECT USING (current_user_has_role('admin'::app_role));

CREATE POLICY "Users can view audit logs for their orders" ON public.crypto_audit_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = crypto_audit_logs.order_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "System can create audit logs" ON public.crypto_audit_logs
FOR INSERT WITH CHECK (true);

-- Create RLS policies for crypto_derivation_counters
CREATE POLICY "System can manage derivation counters" ON public.crypto_derivation_counters
FOR ALL USING (true);

-- Create RLS policies for crypto_price_snapshots
CREATE POLICY "Admins can view all price snapshots" ON public.crypto_price_snapshots
FOR SELECT USING (current_user_has_role('admin'::app_role));

CREATE POLICY "Users can view price snapshots for their orders" ON public.crypto_price_snapshots
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = crypto_price_snapshots.order_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "System can create price snapshots" ON public.crypto_price_snapshots
FOR INSERT WITH CHECK (true);

-- Fix search path for functions to be security definer and stable
CREATE OR REPLACE FUNCTION get_next_derivation_index(p_coin_symbol TEXT, p_address_type TEXT DEFAULT 'receive')
RETURNS INTEGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION log_crypto_audit_event(
  p_event_type TEXT,
  p_order_id UUID DEFAULT NULL,
  p_crypto_address_id UUID DEFAULT NULL,
  p_event_data JSONB DEFAULT '{}',
  p_raw_payload JSONB DEFAULT '{}'
)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;