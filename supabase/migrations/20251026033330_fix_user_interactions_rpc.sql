/*
  # Fix User Interactions with RPC Function

  ## Purpose
  This migration creates a secure database function (RPC) to handle user interaction recording.
  It solves the Row-Level Security (RLS) permission issue where frontend code cannot directly
  insert into user_interactions table using Profile IDs.

  ## Changes Made
  
  1. **New RPC Function: record_interaction**
     - Accepts Profile IDs (from public.profiles table) as parameters
     - Internally looks up corresponding Auth User IDs (from auth.users)
     - Securely inserts interaction records into user_interactions table
     - Uses SECURITY DEFINER to bypass RLS restrictions while maintaining security
     - Includes error handling for invalid Profile IDs

  2. **Security**
     - Function runs with elevated privileges (SECURITY DEFINER)
     - Only accessible to authenticated users
     - Validates that Profile IDs map to valid Auth User IDs before insertion
     - Raises exception if Profile IDs are invalid

  ## Important Notes
  - This function is designed to be called from the frontend via Supabase RPC
  - It accepts Profile IDs (public.profiles.id) not Auth User IDs (auth.users.id)
  - The function handles the ID mapping internally for security
  - Interaction types supported: 'like', 'pass'
*/

-- Create the RPC function to record user interactions securely
CREATE OR REPLACE FUNCTION public.record_interaction(
    p_from_profile_id uuid,
    p_to_profile_id uuid,
    p_interaction_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_from_user_id uuid;
    v_to_user_id uuid;
BEGIN
    -- Look up the Auth User IDs from the Profile IDs
    SELECT user_id INTO v_from_user_id 
    FROM public.profiles 
    WHERE id = p_from_profile_id;
    
    SELECT user_id INTO v_to_user_id 
    FROM public.profiles 
    WHERE id = p_to_profile_id;

    -- Validate that both Profile IDs map to valid Auth User IDs
    IF v_from_user_id IS NULL OR v_to_user_id IS NULL THEN
        RAISE EXCEPTION 'Record Interaction Error: One or both profile IDs do not map to an authenticated user.';
    END IF;

    -- Insert into user_interactions using the found Auth User IDs
    INSERT INTO public.user_interactions (user_id, target_user_id, interaction_type)
    VALUES (v_from_user_id, v_to_user_id, p_interaction_type);
    
END;
$$;

-- Grant permission for authenticated users to execute the function
GRANT EXECUTE ON FUNCTION public.record_interaction TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.record_interaction IS 
'Securely records user interactions (like, pass) by accepting Profile IDs and internally mapping to Auth User IDs. This bypasses RLS restrictions while maintaining security through SECURITY DEFINER.';
