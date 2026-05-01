
CREATE TABLE public.email_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  enabled boolean NOT NULL DEFAULT true,
  from_name text NOT NULL DEFAULT 'Lexach',
  from_email text NOT NULL DEFAULT 'onboarding@resend.dev',
  app_url text NOT NULL DEFAULT 'https://lexach.vercel.app',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.email_settings (id) VALUES (true);

ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email settings"
ON public.email_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update email settings"
ON public.email_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.email_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  label text,
  kind text NOT NULL DEFAULT 'cc' CHECK (kind IN ('cc','bcc')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email recipients"
ON public.email_recipients FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert email recipients"
ON public.email_recipients FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete email recipients"
ON public.email_recipients FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
