-- Update profiles table to store Discord user information
ALTER TABLE public.profiles 
ADD COLUMN discord_id TEXT UNIQUE,
ADD COLUMN discord_username TEXT,
ADD COLUMN discord_avatar_url TEXT;

-- Update the handle_new_user function to handle Discord OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    discord_id, 
    discord_username, 
    discord_avatar_url,
    username
  )
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'provider_id',
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$;