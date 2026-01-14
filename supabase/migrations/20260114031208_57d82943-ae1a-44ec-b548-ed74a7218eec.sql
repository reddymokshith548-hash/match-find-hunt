-- Fix the notify_nda_signed trigger function
-- The problem: connections.user1_id/user2_id are PROFILE IDs
-- but nda_signatures.user_id is an AUTH user ID
-- We need to look up the profile first, then find the other user

CREATE OR REPLACE FUNCTION public.notify_nda_signed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  signer_profile_id UUID;
  other_profile_id UUID;
  other_auth_user_id UUID;
  signer_name TEXT;
BEGIN
  -- Get the signer's profile ID from their auth user ID
  SELECT id, name INTO signer_profile_id, signer_name
  FROM public.profiles
  WHERE user_id = NEW.user_id
  LIMIT 1;
  
  -- If no profile found, skip notification
  IF signer_profile_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get the other user's PROFILE ID from the connection
  SELECT 
    CASE 
      WHEN c.user1_id = signer_profile_id THEN c.user2_id
      ELSE c.user1_id
    END INTO other_profile_id
  FROM public.connections c
  WHERE c.id = NEW.connection_id;
  
  -- If no connection found, skip notification
  IF other_profile_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get the other user's AUTH user ID from their profile
  SELECT user_id INTO other_auth_user_id
  FROM public.profiles
  WHERE id = other_profile_id
  LIMIT 1;
  
  -- If no auth user found, skip notification
  IF other_auth_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Create notification with correct AUTH user IDs
  PERFORM public.create_notification(
    other_auth_user_id,                    -- p_user_id: recipient's AUTH user ID
    'nda_signed',                          -- p_type
    'NDA Signed',                          -- p_title
    COALESCE(signer_name, 'Someone') || ' has signed the NDA',  -- p_message
    NEW.user_id,                           -- p_related_user_id: signer's AUTH user ID
    NEW.connection_id                      -- p_related_id: connection ID
  );
  
  RETURN NEW;
END;
$$;

-- Make sure the trigger exists on nda_signatures
DROP TRIGGER IF EXISTS on_nda_signature_notify ON public.nda_signatures;

CREATE TRIGGER on_nda_signature_notify
  AFTER INSERT ON public.nda_signatures
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_nda_signed();