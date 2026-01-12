-- Create foundersync_history table to track trait changes over time
CREATE TABLE public.foundersync_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  answers JSONB NOT NULL,
  personality_type TEXT,
  leadership_style TEXT,
  risk_tolerance TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.foundersync_history ENABLE ROW LEVEL SECURITY;

-- Users can insert their own history
CREATE POLICY "Users can insert their own history"
ON public.foundersync_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own history
CREATE POLICY "Users can view their own history"
ON public.foundersync_history
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_foundersync_history_user_id ON public.foundersync_history(user_id);
CREATE INDEX idx_foundersync_history_completed_at ON public.foundersync_history(completed_at DESC);