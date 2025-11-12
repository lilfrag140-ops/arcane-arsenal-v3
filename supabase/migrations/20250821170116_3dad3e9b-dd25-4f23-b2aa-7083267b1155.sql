-- Add admin policies for tickets and ticket_messages so admins can view and manage all tickets

-- Admin policies for tickets table
CREATE POLICY "Admins can view all tickets" 
ON public.tickets 
FOR SELECT 
USING (current_user_has_role('admin'::app_role));

CREATE POLICY "Admins can update all tickets" 
ON public.tickets 
FOR UPDATE 
USING (current_user_has_role('admin'::app_role));

-- Admin policies for ticket_messages table  
CREATE POLICY "Admins can view all ticket messages" 
ON public.ticket_messages 
FOR SELECT 
USING (current_user_has_role('admin'::app_role));

CREATE POLICY "Admins can create ticket messages" 
ON public.ticket_messages 
FOR INSERT 
WITH CHECK (current_user_has_role('admin'::app_role));