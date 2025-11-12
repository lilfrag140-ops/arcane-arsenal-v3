-- Create a storage bucket for static files
INSERT INTO storage.buckets (id, name, public) VALUES ('static', 'static', true);

-- Create RLS policies for the static bucket
-- Only admins can upload files
CREATE POLICY "Admin can upload static files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'static' 
  AND auth.jwt() ->> 'email' = 'admin@example.com'  -- Replace with your admin email
);

-- Only admins can update files
CREATE POLICY "Admin can update static files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'static' 
  AND auth.jwt() ->> 'email' = 'admin@example.com'  -- Replace with your admin email
);

-- Only admins can delete files
CREATE POLICY "Admin can delete static files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'static' 
  AND auth.jwt() ->> 'email' = 'admin@example.com'  -- Replace with your admin email
);

-- Anyone can view static files (public read access)
CREATE POLICY "Public can view static files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'static');

-- Create a helper function to get static file URLs
CREATE OR REPLACE FUNCTION public.get_static_file_url(file_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT 
      CASE 
        WHEN bucket.public THEN 
          concat(
            current_setting('app.settings.supabase_url', true),
            '/storage/v1/object/public/',
            bucket.id,
            '/',
            file_path
          )
        ELSE NULL
      END
    FROM storage.buckets bucket
    WHERE bucket.id = 'static'
  );
END;
$$;