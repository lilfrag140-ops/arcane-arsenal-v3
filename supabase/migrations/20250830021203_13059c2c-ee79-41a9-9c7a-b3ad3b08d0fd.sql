-- Create function to mask sensitive payment data for non-admin users
CREATE OR REPLACE FUNCTION public.mask_payment_intent_id(payment_intent_id text, user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN public.current_user_has_role('admin'::app_role) THEN payment_intent_id
      WHEN auth.uid() = user_id AND payment_intent_id IS NOT NULL THEN 
        'pi_****' || RIGHT(payment_intent_id, 4)
      ELSE NULL
    END
$$;

-- Create function to mask Discord IDs for privacy
CREATE OR REPLACE FUNCTION public.mask_discord_id(discord_id text, profile_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN public.current_user_has_role('admin'::app_role) THEN discord_id
      WHEN auth.uid() = profile_user_id THEN discord_id
      ELSE NULL
    END
$$;

-- Create audit log table for sensitive data access
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (public.current_user_has_role('admin'::app_role));

-- Create function to log sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  action_type text,
  table_name text,
  record_id uuid DEFAULT NULL,
  details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    details,
    created_at
  ) VALUES (
    auth.uid(),
    action_type,
    table_name,
    record_id,
    details,
    now()
  );
END;
$$;

-- Add data retention policy function
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete audit logs older than 1 year
  DELETE FROM public.audit_logs 
  WHERE created_at < now() - interval '1 year';
END;
$$;