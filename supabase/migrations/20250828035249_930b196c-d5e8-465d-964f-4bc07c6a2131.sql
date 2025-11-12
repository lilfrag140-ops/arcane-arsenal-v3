-- Fix the static bucket policies to use the existing role system
DROP POLICY IF EXISTS "Admin can upload static files" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update static files" ON storage.objects;  
DROP POLICY IF EXISTS "Admin can delete static files" ON storage.objects;

-- Create new policies using the existing role system
CREATE POLICY "Admin can upload static files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'static' 
  AND current_user_has_role('admin'::app_role)
);

CREATE POLICY "Admin can update static files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'static' 
  AND current_user_has_role('admin'::app_role)
);

CREATE POLICY "Admin can delete static files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'static' 
  AND current_user_has_role('admin'::app_role)
);

-- Fix the helper function to have proper search path
DROP FUNCTION IF EXISTS public.get_static_file_url(TEXT);

CREATE OR REPLACE FUNCTION public.get_static_file_url(file_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  RETURN (
    SELECT 
      CASE 
        WHEN bucket.public THEN 
          concat(
            'https://nkjosjigixkhkgadizqr.supabase.co',
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