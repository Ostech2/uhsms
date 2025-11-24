-- Fix the ID mismatch between auth.users and user_profiles
-- Update the profile ID to match the auth user ID for kamugishaosbert7@gmail.com

UPDATE public.user_profiles
SET id = 'a3f7877a-1d51-45e3-b91d-7300a229c7d1'
WHERE email = 'kamugishaosbert7@gmail.com';

-- Also ensure the user_roles table has the correct ID
UPDATE public.user_roles
SET user_id = 'a3f7877a-1d51-45e3-b91d-7300a229c7d1'
WHERE user_id = '91cfdddd-ed16-4f47-a301-0eec4be0ddc1';