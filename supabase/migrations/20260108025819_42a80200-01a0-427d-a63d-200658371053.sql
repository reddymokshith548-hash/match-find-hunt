-- First, delete duplicate profiles keeping only the most recent one per user
DELETE FROM profiles p1
USING profiles p2
WHERE p1.user_id = p2.user_id 
  AND p1.user_id IS NOT NULL
  AND p1.created_at < p2.created_at;

-- Add unique constraint to prevent future duplicates
ALTER TABLE profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);