-- Update get_matchmaking_candidates function to include stage and looking_for
DROP FUNCTION IF EXISTS get_matchmaking_candidates(integer, boolean);

CREATE OR REPLACE FUNCTION get_matchmaking_candidates(
  limit_count integer DEFAULT 10,
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
AS $$
BEGIN
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
  ORDER BY random()
  LIMIT limit_count;
END;
$$;