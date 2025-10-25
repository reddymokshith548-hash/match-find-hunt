/*
  # Add Spark Room Messages Table

  1. New Tables
    - `spark_room_messages`
      - `id` (uuid, primary key)
      - `room_id` (uuid, references spark_rooms)
      - `user_id` (uuid, references auth.users)
      - `profile_id` (uuid, references profiles)
      - `message` (text)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `spark_room_messages` table
    - Add policies for room members to read and send messages
*/

CREATE TABLE IF NOT EXISTS public.spark_room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.spark_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spark_room_messages ENABLE ROW LEVEL SECURITY;

-- Allow room members to read messages
CREATE POLICY "Room members can read messages"
  ON public.spark_room_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.spark_room_members
      WHERE spark_room_members.room_id = spark_room_messages.room_id
      AND spark_room_members.user_id = auth.uid()
    )
  );

-- Allow room members to send messages
CREATE POLICY "Room members can send messages"
  ON public.spark_room_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.spark_room_members
      WHERE spark_room_members.room_id = spark_room_messages.room_id
      AND spark_room_members.user_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_spark_room_messages_room_id 
  ON public.spark_room_messages(room_id, created_at DESC);
