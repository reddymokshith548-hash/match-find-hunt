
CREATE OR REPLACE FUNCTION public.client_log_auth_event(
  _event_type text,
  _details jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _event_type NOT IN ('failed_login','captcha_failed','signup_blocked','password_reset_requested') THEN
    RAISE EXCEPTION 'invalid_event_type';
  END IF;

  INSERT INTO public.security_events (event_type, severity, user_id, details)
  VALUES (
    _event_type,
    CASE WHEN _event_type = 'failed_login' THEN 'warning' ELSE 'info' END,
    auth.uid(),
    coalesce(_details,'{}'::jsonb)
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.client_log_auth_event(text,jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.client_log_auth_event(text,jsonb) TO anon, authenticated;
