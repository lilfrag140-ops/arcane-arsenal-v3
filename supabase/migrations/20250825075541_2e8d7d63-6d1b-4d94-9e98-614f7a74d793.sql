-- Fix the assign_admin_role_by_email function search path
CREATE OR REPLACE FUNCTION public.assign_admin_role_by_email(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _user_id uuid;
BEGIN
  -- Get user_id from auth.users by email
  SELECT id INTO _user_id 
  FROM auth.users 
  WHERE email = _email
  LIMIT 1;
  
  -- If user exists, assign admin role
  IF _user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$function$;