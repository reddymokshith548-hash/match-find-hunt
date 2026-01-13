-- 1) Fix connection-created notification trigger to use PROFILE IDs and always produce non-null message
CREATE OR REPLACE FUNCTION public.notify_connection_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sender_name text;
  sender_auth_user_id uuid;
  receiver_auth_user_id uuid;
  msg text;
BEGIN
  -- connections.user1_id / user2_id are profile IDs (public.profiles.id)
  SELECT p.name, p.user_id
    INTO sender_name, sender_auth_user_id
  FROM public.profiles p
  WHERE p.id = NEW.user1_id;

  SELECT p.user_id
    INTO receiver_auth_user_id
  FROM public.profiles p
  WHERE p.id = NEW.user2_id;

  -- If we can't resolve the receiver auth user_id, skip notification (but don't block the insert)
  IF receiver_auth_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Ensure message is never NULL (notifications.message is NOT NULL)
  IF sender_name IS NULL OR btrim(sender_name) = '' THEN
    msg := 'New connection request';
  ELSE
    msg := sender_name || ' wants to connect with you';
  END IF;

  PERFORM public.create_notification(
    receiver_auth_user_id,
    'connection_request',
    'New Connection Request',
    msg,
    sender_auth_user_id,
    NEW.id
  );

  RETURN NEW;
END;
$$;

-- 2) Add a profile flag so we can remember FounderSync completion
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS test_completed boolean NOT NULL DEFAULT false;

-- Backfill for existing users who already completed FounderSync
UPDATE public.profiles p
SET test_completed = true
WHERE p.user_id IN (SELECT fr.user_id FROM public.foundersync_results fr);

-- Keep the flag in sync going forward
CREATE OR REPLACE FUNCTION public.set_profile_test_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET test_completed = true
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS foundersync_results_set_test_completed ON public.foundersync_results;
CREATE TRIGGER foundersync_results_set_test_completed
AFTER INSERT OR UPDATE ON public.foundersync_results
FOR EACH ROW
EXECUTE FUNCTION public.set_profile_test_completed();
