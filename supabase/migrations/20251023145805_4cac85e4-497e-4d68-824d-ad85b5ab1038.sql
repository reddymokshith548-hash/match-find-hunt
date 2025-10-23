-- Create NDA Signatures table
CREATE TABLE public.nda_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  profile_id UUID NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  UNIQUE(user_id, connection_id)
);

-- Enable RLS
ALTER TABLE public.nda_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for NDA Signatures
CREATE POLICY "Users can view their own NDA signatures"
ON public.nda_signatures
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own NDA signatures"
ON public.nda_signatures
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('connection_request', 'nda_signed', 'new_message', 'spark_room_invite', 'foundersync_reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_user_id UUID,
  related_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create Spark Rooms table
CREATE TABLE public.spark_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  topic TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spark_rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Spark Rooms
CREATE POLICY "Public rooms are viewable by everyone"
ON public.spark_rooms
FOR SELECT
USING (is_public = true OR auth.uid() = creator_id);

CREATE POLICY "Users can create spark rooms"
ON public.spark_rooms
FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their rooms"
ON public.spark_rooms
FOR UPDATE
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their rooms"
ON public.spark_rooms
FOR DELETE
USING (auth.uid() = creator_id);

-- Create Spark Room Members table
CREATE TABLE public.spark_room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.spark_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS
ALTER TABLE public.spark_room_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Spark Room Members
CREATE POLICY "Room members can view membership"
ON public.spark_room_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.spark_rooms
    WHERE id = room_id AND (is_public = true OR creator_id = auth.uid())
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Users can join rooms"
ON public.spark_room_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
ON public.spark_room_members
FOR DELETE
USING (auth.uid() = user_id);

-- Create FounderSync Results table
CREATE TABLE public.foundersync_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  personality_type TEXT,
  leadership_style TEXT,
  risk_tolerance TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.foundersync_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for FounderSync Results
CREATE POLICY "Users can view their own results"
ON public.foundersync_results
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own results"
ON public.foundersync_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own results"
ON public.foundersync_results
FOR UPDATE
USING (auth.uid() = user_id);

-- Update Messages table to support chat channels
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS connection_id UUID;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;

-- Create index for better message query performance
CREATE INDEX IF NOT EXISTS idx_messages_connection_id ON public.messages(connection_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_related_user_id UUID DEFAULT NULL,
  p_related_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_user_id, related_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_related_user_id, p_related_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Trigger to create notification when connection is created
CREATE OR REPLACE FUNCTION public.notify_connection_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name TEXT;
BEGIN
  -- Get sender's name
  SELECT name INTO sender_name FROM public.profiles WHERE user_id = NEW.user1_id;
  
  -- Create notification for receiver
  PERFORM public.create_notification(
    NEW.user2_id,
    'connection_request',
    'New Connection Request',
    sender_name || ' wants to connect with you',
    NEW.user1_id,
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_connection_created
  AFTER INSERT ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_connection_request();

-- Trigger to create notification when NDA is signed
CREATE OR REPLACE FUNCTION public.notify_nda_signed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  other_user_id UUID;
  other_user_name TEXT;
  signer_name TEXT;
BEGIN
  -- Get the other user in the connection
  SELECT 
    CASE 
      WHEN c.user1_id = NEW.user_id THEN c.user2_id
      ELSE c.user1_id
    END INTO other_user_id
  FROM public.connections c
  WHERE c.id = NEW.connection_id;
  
  -- Get names
  SELECT name INTO signer_name FROM public.profiles WHERE user_id = NEW.user_id;
  
  -- Create notification
  PERFORM public.create_notification(
    other_user_id,
    'nda_signed',
    'NDA Signed',
    signer_name || ' has signed the NDA',
    NEW.user_id,
    NEW.connection_id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_nda_signed
  AFTER INSERT ON public.nda_signatures
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_nda_signed();