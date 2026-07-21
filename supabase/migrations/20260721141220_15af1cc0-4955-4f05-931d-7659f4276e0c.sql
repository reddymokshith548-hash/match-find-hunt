
-- 1. Fix permissive RLS on notifications: only service_role can insert
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Service role can create notifications"
  ON public.notifications FOR INSERT TO service_role WITH CHECK (true);

-- 2. Fix permissive RLS on matches: only service_role can insert/update
DROP POLICY IF EXISTS "Allow system inserts" ON public.matches;
DROP POLICY IF EXISTS "Allow system updates" ON public.matches;
CREATE POLICY "Service role can insert matches"
  ON public.matches FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update matches"
  ON public.matches FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- 3. Remove overly broad chat-media SELECT (scoped participant policy already exists)
DROP POLICY IF EXISTS "Users can view chat media" ON storage.objects;

-- 4. Revoke EXECUTE from anon on non-public RPCs
REVOKE EXECUTE ON FUNCTION public.get_my_profile_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_plan(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.foundersync_compatibility(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_matchmaking_candidates(integer, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_incoming_likes_count(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_incoming_likes_count() FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_interaction(uuid, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_daily_swipe(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_access_connection(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.invoke_notification_email(text, uuid, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_plan(uuid, public.plan_tier) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_user_plans(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_user_roles(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_grant_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_audit_log(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_notification_email_stats(text, timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_notification_email_timeseries(timestamptz) FROM anon;

-- 5. Rate limits table + helper for edge functions
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  ip_hash text,
  bucket text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT date_trunc('minute', now()),
  count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rate_limits_key_unique UNIQUE (user_id, ip_hash, bucket, window_start)
);
CREATE INDEX IF NOT EXISTS rate_limits_window_idx ON public.rate_limits (window_start);
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages rate limits"
  ON public.rate_limits FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id uuid,
  _ip_hash text,
  _bucket text,
  _limit integer,
  _window_seconds integer DEFAULT 60
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  win timestamptz := date_trunc('minute', now());
  cur integer;
BEGIN
  DELETE FROM public.rate_limits
   WHERE window_start < now() - (_window_seconds || ' seconds')::interval - interval '10 minutes';

  INSERT INTO public.rate_limits (user_id, ip_hash, bucket, window_start, count)
  VALUES (_user_id, _ip_hash, _bucket, win, 1)
  ON CONFLICT (user_id, ip_hash, bucket, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO cur;

  RETURN cur <= _limit;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, text, integer, integer) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, text, integer, integer) TO service_role;
