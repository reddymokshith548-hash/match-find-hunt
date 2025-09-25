-- Create a secure matchmaking system with proper access controls

-- First, drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- Create restricted policies for profiles table
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view matched profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE (user1_id = auth.uid() AND user2_id = profiles.user_id)
    OR (user2_id = auth.uid() AND user1_id = profiles.user_id)
  )
);

-- Create a secure function to get matchmaking candidates
CREATE OR REPLACE FUNCTION public.get_matchmaking_candidates(
  limit_count INTEGER DEFAULT 10,
  exclude_interacted BOOLEAN DEFAULT true
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  bio TEXT,
  role TEXT,
  skills TEXT[],
  interests TEXT[],
  stage TEXT,
  looking_for TEXT[],
  profile_pic_url TEXT,
  location TEXT,
  age INTEGER,
  gender TEXT,
  match_score INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_profile RECORD;
BEGIN
  -- Get current user's profile for filtering
  SELECT * INTO current_user_profile 
  FROM public.profiles 
  WHERE profiles.user_id = auth.uid();
  
  -- If no profile exists, return empty
  IF current_user_profile IS NULL THEN
    RETURN;
  END IF;
  
  -- Return potential matches with basic filtering
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.name,
    p.bio,
    p.role,
    p.skills,
    p.interests,
    p.stage,
    p.looking_for,
    p.profile_pic_url,
    p.location,
    p.age,
    p.gender,
    -- Simple match score based on common interests/skills
    (
      COALESCE(array_length(ARRAY(SELECT unnest(p.interests) INTERSECT SELECT unnest(current_user_profile.interests)), 1), 0) +
      COALESCE(array_length(ARRAY(SELECT unnest(p.skills) INTERSECT SELECT unnest(current_user_profile.looking_for)), 1), 0) +
      COALESCE(array_length(ARRAY(SELECT unnest(current_user_profile.skills) INTERSECT SELECT unnest(p.looking_for)), 1), 0)
    )::INTEGER as match_score
  FROM public.profiles p
  WHERE p.user_id != auth.uid()
    AND p.profile_completed = true
    -- Age preference filtering (if set)
    AND (current_user_profile.preferred_age_min IS NULL OR p.age >= current_user_profile.preferred_age_min)
    AND (current_user_profile.preferred_age_max IS NULL OR p.age <= current_user_profile.preferred_age_max)
    -- Gender preference filtering (if set)
    AND (current_user_profile.preferred_gender IS NULL OR p.gender = current_user_profile.preferred_gender)
    -- Exclude users already interacted with (if requested)
    AND (
      NOT exclude_interacted 
      OR NOT EXISTS (
        SELECT 1 FROM public.user_interactions ui 
        WHERE ui.user_id = auth.uid() 
        AND ui.target_user_id = p.user_id
      )
    )
    -- Exclude existing matches
    AND NOT EXISTS (
      SELECT 1 FROM public.matches m 
      WHERE (m.user1_id = auth.uid() AND m.user2_id = p.user_id)
      OR (m.user2_id = auth.uid() AND m.user1_id = p.user_id)
    )
  ORDER BY match_score DESC, p.last_active DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_matchmaking_candidates TO authenticated;