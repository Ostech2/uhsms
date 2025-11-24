-- Create auth users trigger to sync with user_profiles
CREATE OR REPLACE FUNCTION public.handle_auth_user_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update last_login timestamp when user logs in
  UPDATE public.user_profiles
  SET last_login = now()
  WHERE email = NEW.email;
  
  RETURN NEW;
END;
$$;

-- Trigger to update last_login on auth
CREATE OR REPLACE TRIGGER on_auth_user_login
  AFTER INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_login();

-- Function to check if email exists in user_profiles
CREATE OR REPLACE FUNCTION public.is_user_authorized(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE email = user_email AND status = 'active'
  );
END;
$$;

-- Update RLS policies for user_profiles to require authentication
DROP POLICY IF EXISTS "Authenticated users can manage user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Anyone can view user profiles" ON public.user_profiles;

-- Only authenticated users can view profiles
CREATE POLICY "Authenticated users can view user profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);

-- Only authenticated users can insert profiles
CREATE POLICY "Authenticated users can insert user profiles"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only authenticated users can update profiles
CREATE POLICY "Authenticated users can update user profiles"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (true);

-- Only authenticated users can delete profiles
CREATE POLICY "Authenticated users can delete user profiles"
ON public.user_profiles
FOR DELETE
TO authenticated
USING (true);