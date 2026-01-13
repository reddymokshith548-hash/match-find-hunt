-- Add a CHECK constraint to ensure profile names are never empty
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_name_not_empty CHECK (trim(name) <> '');