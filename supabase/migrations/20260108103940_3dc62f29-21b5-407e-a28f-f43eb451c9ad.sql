-- Fix connections RLS policies to use profile IDs instead of auth.uid()
-- The connections table stores profile IDs (foreign keys to profiles.id)

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated user to create a connection" ON connections;
DROP POLICY IF EXISTS "Allow updating NDA or acceptance status" ON connections;
DROP POLICY IF EXISTS "Allow user to create their own connection requests" ON connections;
DROP POLICY IF EXISTS "Allow viewing connections involving the user" ON connections;
DROP POLICY IF EXISTS "Users can create connections as user1" ON connections;
DROP POLICY IF EXISTS "Users can delete their connections" ON connections;
DROP POLICY IF EXISTS "Users can update their connections" ON connections;
DROP POLICY IF EXISTS "Users can view their own connections" ON connections;

-- Create new policies using get_my_profile_id() function
CREATE POLICY "Users can view their own connections"
ON connections FOR SELECT
USING (
  user1_id = get_my_profile_id() OR user2_id = get_my_profile_id()
);

CREATE POLICY "Users can create connections as user1"
ON connections FOR INSERT
WITH CHECK (user1_id = get_my_profile_id());

CREATE POLICY "Users can update their connections"
ON connections FOR UPDATE
USING (user1_id = get_my_profile_id() OR user2_id = get_my_profile_id());

CREATE POLICY "Users can delete their connections"
ON connections FOR DELETE
USING (user1_id = get_my_profile_id() OR user2_id = get_my_profile_id());

-- Fix user_interactions RLS policies
-- The user_interactions table also needs to work with profile IDs since record_interaction RPC converts them

DROP POLICY IF EXISTS "Allow authenticated user to insert their own interaction" ON user_interactions;
DROP POLICY IF EXISTS "Users can create their own interactions" ON user_interactions;
DROP POLICY IF EXISTS "Users can update their own interactions" ON user_interactions;
DROP POLICY IF EXISTS "Users can view their own interactions" ON user_interactions;

-- Create new policies for user_interactions
-- Note: record_interaction RPC converts profile IDs to user IDs, so RLS should use auth.uid()
CREATE POLICY "Users can view their own interactions"
ON user_interactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interactions"
ON user_interactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions"
ON user_interactions FOR UPDATE
USING (auth.uid() = user_id);