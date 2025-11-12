-- Create table to track Tebex checkouts and payments
CREATE TABLE IF NOT EXISTS public.tebex_checkouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tebex_ident TEXT NOT NULL UNIQUE,
  tebex_checkout_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT tebex_checkouts_status_check CHECK (status IN ('pending', 'completed', 'cancelled', 'expired'))
);

-- Enable RLS
ALTER TABLE public.tebex_checkouts ENABLE ROW LEVEL SECURITY;

-- Users can view their own checkouts
CREATE POLICY "Users can view their own tebex checkouts"
ON public.tebex_checkouts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = tebex_checkouts.order_id
    AND o.user_id = auth.uid()
  )
);

-- Service role can manage all checkouts
CREATE POLICY "Service role can manage tebex checkouts"
ON public.tebex_checkouts
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Admins can view all checkouts
CREATE POLICY "Admins can view all tebex checkouts"
ON public.tebex_checkouts
FOR SELECT
USING (public.current_user_has_role('admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_tebex_checkouts_order_id ON public.tebex_checkouts(order_id);
CREATE INDEX idx_tebex_checkouts_ident ON public.tebex_checkouts(tebex_ident);
CREATE INDEX idx_tebex_checkouts_status ON public.tebex_checkouts(status);

-- Add trigger for updated_at
CREATE TRIGGER update_tebex_checkouts_updated_at
BEFORE UPDATE ON public.tebex_checkouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();