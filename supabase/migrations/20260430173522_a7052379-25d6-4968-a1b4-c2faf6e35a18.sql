-- Audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  role app_role NOT NULL,
  action text NOT NULL CHECK (action IN ('granted','revoked')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx
  ON public.admin_audit_log (created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can view audit log"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Grant role with audit
CREATE OR REPLACE FUNCTION public.admin_grant_role(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  IF inserted_count > 0 THEN
    INSERT INTO public.admin_audit_log (actor_user_id, target_user_id, role, action)
    VALUES (auth.uid(), _user_id, _role, 'granted');
  END IF;
END;
$$;

-- Revoke role with audit
CREATE OR REPLACE FUNCTION public.admin_revoke_role(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining_admins int;
  deleted_count int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _role = 'admin' THEN
    SELECT count(*) INTO remaining_admins
    FROM public.user_roles
    WHERE role = 'admin' AND user_id <> _user_id;

    IF remaining_admins = 0 THEN
      RAISE EXCEPTION 'Cannot revoke the last admin';
    END IF;
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = _user_id AND role = _role;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count > 0 THEN
    INSERT INTO public.admin_audit_log (actor_user_id, target_user_id, role, action)
    VALUES (auth.uid(), _user_id, _role, 'revoked');
  END IF;
END;
$$;

-- Fetch recent audit entries with actor/target identity
CREATE OR REPLACE FUNCTION public.admin_list_audit_log(_limit int DEFAULT 100)
RETURNS TABLE(
  id uuid,
  created_at timestamptz,
  action text,
  role app_role,
  actor_user_id uuid,
  actor_email text,
  actor_name text,
  target_user_id uuid,
  target_email text,
  target_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.created_at,
    l.action,
    l.role,
    l.actor_user_id,
    au.email::text  AS actor_email,
    ap.name         AS actor_name,
    l.target_user_id,
    tu.email::text  AS target_email,
    tp.name         AS target_name
  FROM public.admin_audit_log l
  LEFT JOIN auth.users au       ON au.id = l.actor_user_id
  LEFT JOIN public.profiles ap  ON ap.user_id = l.actor_user_id
  LEFT JOIN auth.users tu       ON tu.id = l.target_user_id
  LEFT JOIN public.profiles tp  ON tp.user_id = l.target_user_id
  ORDER BY l.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 500));
END;
$$;