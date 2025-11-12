-- Fix the remaining function with missing search_path
DROP FUNCTION IF EXISTS public.cleanup_old_audit_logs();
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void 
SECURITY DEFINER
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete audit logs older than 1 year
  DELETE FROM public.audit_logs 
  WHERE created_at < now() - interval '1 year';
END;
$$;