-- Fix messages RLS: messages.sender_id/receiver_id store profile IDs (UUIDs), not auth.uid()
-- Current policies compare auth.uid() to sender_id, which blocks chat and can break NDA->messages workflow.

-- Replace incorrect policies
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can mark received messages read" ON public.messages;

-- Allow participants in a conversation (by profile id) to read messages
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
USING (
  sender_id = public.get_my_profile_id()
  OR receiver_id = public.get_my_profile_id()
);

-- Allow sending messages only as yourself (by profile id)
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_id = public.get_my_profile_id()
  AND receiver_id IS NOT NULL
  AND connection_id IS NOT NULL
);

-- Allow marking messages read by the receiver
CREATE POLICY "Users can mark received messages read"
ON public.messages
FOR UPDATE
USING (receiver_id = public.get_my_profile_id())
WITH CHECK (receiver_id = public.get_my_profile_id());
