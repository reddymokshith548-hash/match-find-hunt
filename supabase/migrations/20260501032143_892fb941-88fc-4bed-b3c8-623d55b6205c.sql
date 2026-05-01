
ALTER TABLE public.email_settings
ADD COLUMN IF NOT EXISTS reply_to text;
