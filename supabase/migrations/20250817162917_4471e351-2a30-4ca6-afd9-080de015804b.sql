-- First, create an enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for proper role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable Row-Level Security on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create helper function to check if current user has a role
CREATE OR REPLACE FUNCTION public.current_user_has_role(_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), _role)
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (public.current_user_has_role('admin'));

CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
USING (public.current_user_has_role('admin'));

-- Drop the insecure policy that allows any authenticated user to manage products
DROP POLICY IF EXISTS "Only authenticated users can manage products" ON public.products;

-- Create secure policies for products table
CREATE POLICY "Admins can manage all products" 
ON public.products 
FOR ALL 
USING (public.current_user_has_role('admin'));

-- Keep public read access for products (this is correct for an e-commerce site)
-- The "Products are viewable by everyone" policy should already exist and is secure

-- Insert a default admin user role (replace with actual admin user ID when known)
-- This is commented out - you'll need to manually add admin roles for specific users
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('your-admin-user-id-here', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;