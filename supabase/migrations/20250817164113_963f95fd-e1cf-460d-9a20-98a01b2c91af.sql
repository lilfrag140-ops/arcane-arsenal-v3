-- Add admin role for the specified admin email
-- First, we need to insert a user role for the admin user
-- Note: This assumes the user with email 'lilfrag2.0@gmail.com' exists in auth.users
-- In production, this would be handled when the user signs up or through admin panel

-- For now, we'll create a placeholder approach that can be used when the admin user is created
-- The actual admin role assignment should be done after the user signs up

-- Create a function to assign admin role to a user by email (to be used by system admin)
CREATE OR REPLACE FUNCTION assign_admin_role_by_email(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- You can call this function manually once the admin user signs up:
-- SELECT assign_admin_role_by_email('lilfrag2.0@gmail.com');