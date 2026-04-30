
-- 1. Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. RLS for user_roles: users can see their own; admins can see/manage all
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Admin RPC: set a user's plan (free/pro/etc.)
CREATE OR REPLACE FUNCTION public.admin_set_user_plan(_user_id uuid, _plan public.plan_tier)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = _user_id) THEN
    UPDATE public.subscriptions
    SET plan = _plan,
        status = 'active',
        current_period_end = CASE WHEN _plan = 'free' THEN NULL ELSE now() + interval '1 year' END,
        updated_at = now()
    WHERE user_id = _user_id;
  ELSE
    INSERT INTO public.subscriptions (user_id, plan, status, current_period_end)
    VALUES (
      _user_id,
      _plan,
      'active',
      CASE WHEN _plan = 'free' THEN NULL ELSE now() + interval '1 year' END
    );
  END IF;
END;
$$;

-- 5. Admin RPC: list users with their plan + email/name for the admin panel
CREATE OR REPLACE FUNCTION public.admin_list_user_plans(_search text DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  email text,
  name text,
  plan public.plan_tier,
  status text,
  current_period_end timestamptz
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
    u.id AS user_id,
    u.email::text,
    p.name,
    COALESCE(s.plan, 'free'::public.plan_tier) AS plan,
    COALESCE(s.status, 'active') AS status,
    s.current_period_end
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN public.subscriptions s ON s.user_id = u.id
  WHERE _search IS NULL
     OR u.email ILIKE '%' || _search || '%'
     OR p.name  ILIKE '%' || _search || '%'
  ORDER BY u.created_at DESC
  LIMIT 200;
END;
$$;

-- 6. Allow subscriptions INSERT/UPDATE only via the SECURITY DEFINER function
-- (table already denies direct insert/update for users — leaving it as is)
