-- Add RLS policy to allow users to view profiles of users they have pending/accepted connections with
CREATE POLICY "Users can view profiles of connected users" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM connections 
    WHERE (
      (connections.user1_id = profiles.id AND connections.user2_id = get_my_profile_id())
      OR 
      (connections.user2_id = profiles.id AND connections.user1_id = get_my_profile_id())
    )
  )
);