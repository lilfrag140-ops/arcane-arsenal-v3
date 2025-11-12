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

-- Create view for orders with masked payment data
CREATE OR REPLACE VIEW public.orders_view AS
SELECT 
  id,
  user_id,
  total_amount,
  status,
  minecraft_username,
  payment_method,
  public.mask_payment_intent_id(stripe_payment_intent_id, user_id) as stripe_payment_intent_id,
  created_at,
  updated_at
FROM public.orders;

-- Grant access to the view
GRANT SELECT ON public.orders_view TO authenticated;

-- Create view for profiles with masked sensitive data  
CREATE OR REPLACE VIEW public.profiles_view AS
SELECT 
  id,
  user_id,
  discord_username,
  public.mask_discord_id(discord_id, user_id) as discord_id,
  discord_avatar_url,
  username,
  minecraft_username,
  avatar_url,
  total_spent,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the profile view
GRANT SELECT ON public.profiles_view TO authenticated;

-- Create RLS policies for the views
CREATE POLICY "Users can view masked orders"
ON public.orders_view
FOR SELECT
USING (
  auth.uid() = user_id OR 
  public.current_user_has_role('admin'::app_role)
);

CREATE POLICY "Users can view masked profiles"  
ON public.profiles_view
FOR SELECT
USING (
  auth.uid() = user_id OR
  public.current_user_has_role('admin'::app_role)
);

-- Update existing orders RLS to add audit logging for admin access
CREATE OR REPLACE FUNCTION public.audit_admin_order_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log when admins access user orders
  IF public.current_user_has_role('admin'::app_role) AND auth.uid() != NEW.user_id THEN
    PERFORM public.log_sensitive_access(
      'admin_order_view',
      'orders',
      NEW.id,
      jsonb_build_object('viewed_user_id', NEW.user_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for audit logging on order access
CREATE TRIGGER audit_order_access
  AFTER SELECT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_admin_order_access();

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