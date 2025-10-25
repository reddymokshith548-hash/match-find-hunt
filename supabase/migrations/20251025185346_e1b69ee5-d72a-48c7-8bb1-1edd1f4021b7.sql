-- Update connections table to support proper multi-step flow
ALTER TABLE public.connections 
ADD COLUMN IF NOT EXISTS nda_signed_by_user1 BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS nda_signed_by_user2 BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS user1_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS user2_accepted_at TIMESTAMP WITH TIME ZONE;

-- Create skill_categories table for organizing skills with colors
CREATE TABLE IF NOT EXISTS public.skill_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read skill categories
CREATE POLICY "Skill categories are viewable by everyone"
ON public.skill_categories
FOR SELECT
USING (true);

-- Insert default skill categories with distinct colors
INSERT INTO public.skill_categories (name, color_code) VALUES
  ('Technical', 'hsl(217, 91%, 60%)'),      -- Blue
  ('Marketing', 'hsl(142, 71%, 45%)'),      -- Green
  ('Design', 'hsl(48, 96%, 53%)'),          -- Yellow
  ('Business', 'hsl(262, 83%, 58%)'),       -- Purple
  ('Product', 'hsl(346, 77%, 50%)'),        -- Red
  ('Sales', 'hsl(173, 80%, 40%)'),          -- Teal
  ('Operations', 'hsl(24, 95%, 53%)'),      -- Orange
  ('Finance', 'hsl(200, 98%, 39%)')         -- Dark Blue
ON CONFLICT (name) DO NOTHING;

-- Create a mapping table for skills to categories
CREATE TABLE IF NOT EXISTS public.skill_category_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES public.skill_categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.skill_category_mapping ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read skill mappings
CREATE POLICY "Skill mappings are viewable by everyone"
ON public.skill_category_mapping
FOR SELECT
USING (true);

-- Insert common skill mappings
INSERT INTO public.skill_category_mapping (skill_name, category_id) 
SELECT 'JavaScript', id FROM public.skill_categories WHERE name = 'Technical'
UNION ALL SELECT 'Python', id FROM public.skill_categories WHERE name = 'Technical'
UNION ALL SELECT 'React', id FROM public.skill_categories WHERE name = 'Technical'
UNION ALL SELECT 'Node.js', id FROM public.skill_categories WHERE name = 'Technical'
UNION ALL SELECT 'TypeScript', id FROM public.skill_categories WHERE name = 'Technical'
UNION ALL SELECT 'SEO', id FROM public.skill_categories WHERE name = 'Marketing'
UNION ALL SELECT 'Content Marketing', id FROM public.skill_categories WHERE name = 'Marketing'
UNION ALL SELECT 'Social Media', id FROM public.skill_categories WHERE name = 'Marketing'
UNION ALL SELECT 'UI/UX', id FROM public.skill_categories WHERE name = 'Design'
UNION ALL SELECT 'Graphic Design', id FROM public.skill_categories WHERE name = 'Design'
UNION ALL SELECT 'Figma', id FROM public.skill_categories WHERE name = 'Design'
UNION ALL SELECT 'Strategy', id FROM public.skill_categories WHERE name = 'Business'
UNION ALL SELECT 'Business Development', id FROM public.skill_categories WHERE name = 'Business'
UNION ALL SELECT 'Product Management', id FROM public.skill_categories WHERE name = 'Product'
UNION ALL SELECT 'Sales', id FROM public.skill_categories WHERE name = 'Sales'
UNION ALL SELECT 'Accounting', id FROM public.skill_categories WHERE name = 'Finance'
ON CONFLICT (skill_name) DO NOTHING;

-- Update connections status to use proper values
UPDATE public.connections 
SET status = 'pending' 
WHERE status IS NULL OR status = '';

-- Create a function to check if both users signed NDA
CREATE OR REPLACE FUNCTION public.check_connection_nda_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If both users signed NDA, update status to accepted
  IF NEW.nda_signed_by_user1 = TRUE AND NEW.nda_signed_by_user2 = TRUE THEN
    NEW.status = 'accepted';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update connection status
DROP TRIGGER IF EXISTS connection_nda_check ON public.connections;
CREATE TRIGGER connection_nda_check
  BEFORE UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.check_connection_nda_status();