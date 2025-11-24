-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'male_warden', 'female_warden');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Create security definer function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- DROP existing overly permissive policies on warden_approvals
DROP POLICY IF EXISTS "Anyone can view approvals" ON public.warden_approvals;
DROP POLICY IF EXISTS "Authenticated users can manage approvals" ON public.warden_approvals;

-- Create proper RLS policies for warden_approvals
-- Admins can view all approvals
CREATE POLICY "Admins can view all approvals"
ON public.warden_approvals
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Wardens can view their own approval requests
CREATE POLICY "Wardens can view their own approvals"
ON public.warden_approvals
FOR SELECT
TO authenticated
USING (warden_id = auth.uid());

-- Admins can manage all approvals
CREATE POLICY "Admins can manage all approvals"
ON public.warden_approvals
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Wardens can create their own approval requests
CREATE POLICY "Wardens can create their own approvals"
ON public.warden_approvals
FOR INSERT
TO authenticated
WITH CHECK (warden_id = auth.uid());

-- DROP existing overly permissive policies on user_profiles
DROP POLICY IF EXISTS "Authenticated users can view user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can insert user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can update user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can delete user profiles" ON public.user_profiles;

-- Create proper RLS policies for user_profiles
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS policies for user_roles table
-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage all roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));