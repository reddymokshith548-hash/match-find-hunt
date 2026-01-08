-- Drop both overloaded functions to resolve ambiguity
DROP FUNCTION IF EXISTS public.get_matchmaking_candidates(boolean, integer);
DROP FUNCTION IF EXISTS public.get_matchmaking_candidates(integer, boolean);

-- Create a single clean version with named parameters
CREATE OR REPLACE FUNCTION public.get_matchmaking_candidates(
  limit_count integer DEFAULT 20,
  exclude_interacted boolean DEFAULT true
)
RETURNS TABLE(
  id uuid,
  name text,
  role text,
  age integer,
  interests text[],
  skills text[],
  match_score integer,
  bio text,
  location text,
  stage text,
  looking_for text[],
  profile_pic_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_profile_id uuid;
BEGIN
  -- Get the current user's profile id
  SELECT p.id INTO current_user_profile_id 
  FROM profiles p 
  WHERE p.user_id = auth.uid();

  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.role,
    p.age,
    p.interests,
    p.skills,
    (80 + (random() * 20)::int) AS match_score,
    p.bio,
    p.location,
    p.stage,
    p.looking_for,
    p.profile_pic_url
  FROM profiles p
  WHERE p.is_active = TRUE
    AND p.user_id != auth.uid()
    AND (current_user_profile_id IS NULL OR p.id != current_user_profile_id)
  ORDER BY random()
  LIMIT limit_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_matchmaking_candidates(integer, boolean) TO authenticated;