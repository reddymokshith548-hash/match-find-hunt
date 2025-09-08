-- Enable Row Level Security on connections table
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Allow users to view connections where they are either user1 or user2
CREATE POLICY "Users can view their own connections" 
ON public.connections 
FOR SELECT 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Allow users to create connections where they are user1
CREATE POLICY "Users can create connections as user1" 
ON public.connections 
FOR INSERT 
WITH CHECK (auth.uid() = user1_id);

-- Allow users to update connections where they are involved
CREATE POLICY "Users can update their connections" 
ON public.connections 
FOR UPDATE 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Allow users to delete connections where they are involved
CREATE POLICY "Users can delete their connections" 
ON public.connections 
FOR DELETE 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);