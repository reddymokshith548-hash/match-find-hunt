-- Add intelligence engine columns to matches table
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS hidden_reason text,
ADD COLUMN IF NOT EXISTS final_score integer,
ADD COLUMN IF NOT EXISTS phase text DEFAULT 'phase1',
ADD COLUMN IF NOT EXISTS ai_summary_user1 text,
ADD COLUMN IF NOT EXISTS ai_summary_user2 text;

-- Create index for faster queries on visible matches
CREATE INDEX IF NOT EXISTS idx_matches_visible ON public.matches(is_visible) WHERE is_visible = true;

-- Create index for phase-based queries
CREATE INDEX IF NOT EXISTS idx_matches_phase ON public.matches(phase);

-- Add RLS policy for matches to allow insert from edge functions
-- Drop existing insert policy if exists and create new one
DROP POLICY IF EXISTS "Allow system inserts" ON public.matches;
CREATE POLICY "Allow system inserts" ON public.matches FOR INSERT WITH CHECK (true);

-- Update policy to allow updates from edge functions
DROP POLICY IF EXISTS "Allow system updates" ON public.matches;
CREATE POLICY "Allow system updates" ON public.matches FOR UPDATE USING (true);