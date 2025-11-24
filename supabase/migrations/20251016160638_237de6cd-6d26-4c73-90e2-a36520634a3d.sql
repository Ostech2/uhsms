-- Fix the handle_auth_user_login trigger function
-- The issue: trying to access NEW.email which doesn't exist in auth.users trigger context
-- Solution: Match on user ID instead

DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_auth_user_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update last_login timestamp using the user's ID instead of email
  UPDATE public.user_profiles
  SET last_login = now()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger on auth.users
CREATE TRIGGER on_auth_user_login
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_login();