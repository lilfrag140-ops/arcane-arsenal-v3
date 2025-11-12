-- Create tickets table for support system
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket_messages table for ticket conversations
CREATE TABLE public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID,
  message TEXT NOT NULL,
  is_admin_reply BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for tickets
CREATE POLICY "Users can view their own tickets" 
ON public.tickets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets" 
ON public.tickets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets" 
ON public.tickets 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for ticket messages
CREATE POLICY "Users can view messages for their tickets" 
ON public.ticket_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE tickets.id = ticket_messages.ticket_id 
    AND tickets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages for their tickets" 
ON public.ticket_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE tickets.id = ticket_messages.ticket_id 
    AND tickets.user_id = auth.uid()
  )
);

-- Create trigger for updating tickets updated_at
CREATE OR REPLACE FUNCTION public.update_tickets_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_tickets_updated_at_column();