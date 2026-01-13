-- Enable realtime for the matches table
ALTER TABLE public.matches REPLICA IDENTITY FULL;

-- Add the matches table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;