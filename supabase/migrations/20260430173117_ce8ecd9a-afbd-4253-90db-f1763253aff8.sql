-- Admin RPCs for managing user roles
CREATE OR REPLACE FUNCTION public.admin_list_user_roles(_search text DEFAULT NULL)
RETURNS TABLE(user_id uuid, email text, name text, roles app_role[])
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
    u.id AS user_id,
    u.email::text,
    p.name,
    COALESCE(
      (SELECT array_agg(ur.role ORDER BY ur.role) FROM public.user_roles ur WHERE ur.user_id = u.id),
      ARRAY[]::app_role[]
    ) AS roles
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE _search IS NULL
     OR u.email ILIKE '%' || _search || '%'
     OR p.name  ILIKE '%' || _search || '%'
  ORDER BY u.created_at DESC
  LIMIT 200;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_grant_role(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_role(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining_admins int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Prevent removing the last admin
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
END;
$$;

-- Ensure unique constraint exists for ON CONFLICT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;