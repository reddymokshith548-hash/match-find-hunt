
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  user_id uuid,
  ip_hash text,
  user_agent text,
  path text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS security_events_created_idx ON public.security_events (created_at DESC);
CREATE INDEX IF NOT EXISTS security_events_type_idx ON public.security_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS security_events_severity_idx ON public.security_events (severity, created_at DESC);

GRANT ALL ON public.security_events TO service_role;
GRANT SELECT ON public.security_events TO authenticated;

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read security events"
  ON public.security_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can write security events"
  ON public.security_events FOR INSERT TO service_role WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.log_security_event(
  _event_type text,
  _severity text DEFAULT 'info',
  _user_id uuid DEFAULT NULL,
  _ip_hash text DEFAULT NULL,
  _user_agent text DEFAULT NULL,
  _path text DEFAULT NULL,
  _details jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_events (event_type, severity, user_id, ip_hash, user_agent, path, details)
  VALUES (_event_type, coalesce(_severity,'info'), _user_id, _ip_hash, _user_agent, _path, coalesce(_details,'{}'::jsonb));
END;
$$;
REVOKE EXECUTE ON FUNCTION public.log_security_event(text,text,uuid,text,text,text,jsonb) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.log_security_event(text,text,uuid,text,text,text,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_security_events(_limit integer DEFAULT 200, _severity text DEFAULT NULL)
RETURNS SETOF public.security_events
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT * FROM public.security_events
  WHERE _severity IS NULL OR severity = _severity
  ORDER BY created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 1000));
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_security_events(integer,text) FROM anon;
