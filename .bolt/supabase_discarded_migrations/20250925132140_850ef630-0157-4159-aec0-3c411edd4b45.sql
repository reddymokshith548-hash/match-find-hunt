-- CRITICAL SECURITY FIXES

-- 1. Remove public read access from profiles table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- 2. Add proper RLS policies for photos table
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Users can only view their own photos
CREATE POLICY "Users can view their own photos" 
ON public.photos 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Users can only upload their own photos
CREATE POLICY "Users can insert their own photos" 
ON public.photos 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own photos
CREATE POLICY "Users can update their own photos" 
ON public.photos 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Users can only delete their own photos
CREATE POLICY "Users can delete their own photos" 
ON public.photos 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Allow viewing photos of matched users
CREATE POLICY "Users can view photos of matched users" 
ON public.photos 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE (user1_id = auth.uid() AND user2_id = photos.user_id)
    OR (user2_id = auth.uid() AND user1_id = photos.user_id)
  )
);

-- 3. Add RLS policies for matches table
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Users can only view their own matches
CREATE POLICY "Users can view their own matches" 
ON public.matches 
FOR SELECT 
TO authenticated
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can update their own matches (for status changes)
CREATE POLICY "Users can update their own matches" 
ON public.matches 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 4. Add RLS policies for user_interactions table
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own interactions
CREATE POLICY "Users can view their own interactions" 
ON public.user_interactions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Users can only create their own interactions
CREATE POLICY "Users can create their own interactions" 
ON public.user_interactions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own interactions
CREATE POLICY "Users can update their own interactions" 
ON public.user_interactions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- 5. Fix database function security
CREATE OR REPLACE FUNCTION public.create_match_if_mutual()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    -- If both users liked each other, create a match
    IF NEW.interaction_type = 'like' AND 
       EXISTS (
           SELECT 1 FROM public.user_interactions 
           WHERE user_id = NEW.target_user_id 
           AND target_user_id = NEW.user_id 
           AND interaction_type = 'like'
       ) THEN
        
        INSERT INTO public.matches (user1_id, user2_id)
        VALUES (
            LEAST(NEW.user_id, NEW.target_user_id),
            GREATEST(NEW.user_id, NEW.target_user_id)
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$function$;