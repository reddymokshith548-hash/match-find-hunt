-- Fix the infinite recursion by making get_my_profile_id SECURITY DEFINER
-- This allows it to bypass RLS when called from within RLS policies

CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Also add a policy for matchmaking - users should be able to view active profiles for discovery
-- This prevents the need for complex RLS chains that cause recursion
DROP POLICY IF EXISTS "Users can view active profiles for matchmaking" ON public.profiles;

CREATE POLICY "Users can view active profiles for matchmaking" 
ON public.profiles 
FOR SELECT 
USING (
  is_active = true
);