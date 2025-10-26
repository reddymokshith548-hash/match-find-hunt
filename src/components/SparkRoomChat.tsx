import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  message: string;
  created_at: string;
  profile: {
    id: string;
    name: string;
    profile_pic_url?: string | null; // Allow null for safety
  };
}

interface SparkRoomChatProps {
  roomId: string;
  roomName: string;
  onClose: () => void;
}

export default function SparkRoomChat({ roomId, roomName, onClose }: SparkRoomChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- FIX 1: Enhanced Profile Fetching Logic ---
  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name') // Also select name just in case, though we only need ID here
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle to handle 'no row' gracefully

      if (error && error.code !== 'PGRST116') { // PGRST116 is 'No rows found', which is fine
        throw error;
      }
      
      const profileData = data as { id: string, name: string } | null;

      if (!profileData) {
        // This is a CRITICAL WARNING for the user.
        console.warn('Profile not found for authenticated user. Cannot send messages.');
        setProfileId(null);
        toast({
          title: 'Profile Missing',
          description: 'Please complete your profile setup to participate in chats.',
          variant: 'destructive',
        });
        return;
      }

      setProfileId(profileData.id);

    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      toast({
        title: 'Error',
        description: 'Failed to load user profile.',
        variant: 'destructive',
      });
    }
  };
  
  // Existing fetchMessages remains mostly the same, ensuring proper casting
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('spark_room_messages')
        .select(`
          id,
          message,
          created_at,
          profile:profiles(id, name, profile_pic_url)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase error fetching messages:', error);
        throw error;
      }
      // Explicitly cast to Message[] to satisfy TypeScript
      setMessages((data as Message[]) || []); 
    } catch (error) {
      // ... existing error handling
    } finally {
      setLoading(false);
    }
  };


  // --- FIX 2: Stronger Realtime Payload Processing with Fallback ---
  const subscribeToMessages = () => {
    if (!roomId) return () => {};

    const channel = supabase.channel(`room-${roomId}`);

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'spark_room_messages',
        filter: `room_id=eq.${roomId}`,
      },
      async (payload) => {
        try {
          const profileIdFromPayload = (payload.new as any)?.profile_id;
          
          let profileData = null;
          // Only attempt to fetch profile if we have the ID
          if (profileIdFromPayload) {
            // Use maybeSingle and select only necessary columns
            const { data: profileRes, error: profileError } = await supabase
              .from('profiles')
              .select('id, name, profile_pic_url')
              .eq('id', profileIdFromPayload)
              .maybeSingle();

            if (profileError && profileError.code !== 'PGRST116') {
              // Log error but don't crash, use a fallback
              console.error('Error fetching profile for new message:', profileError);
            }
            profileData = profileRes;
          }

          // Define a safe fallback profile object
          const fallbackProfile: Message['profile'] = { 
            id: profileIdFromPayload || 'unknown', 
            name: 'System/Unknown User', 
            profile_pic_url: null 
          };


          const newMsg: Message = {
            id: (payload.new as any).id,
            message: (payload.new as any).message,
            created_at: (payload.new as any).created_at,
            // Use profileData if it exists, otherwise use the fallback
            profile: (profileData as Message['profile'] | null) ?? fallbackProfile,
          };

          setMessages((prev) => [...prev, newMsg]);
        } catch (err) {
          // General error handling for the realtime listener
          console.error('CRITICAL: Error handling realtime payload. Possible crash source.', err, payload);
          toast({
            title: 'Realtime Error',
            description: 'A problem occurred while updating the chat in real-time.',
            variant: 'destructive',
          });
        }
      }
    );

    channel.subscribe((status) => {
      console.debug('Supabase realtime channel status for', roomId, status);
    });

    return () => {
      try {
        supabase.removeChannel(channel);
        console.debug('Removed supabase channel for room', roomId);
      } catch (err) {
        console.error('Error removing supabase channel:', err);
      }
    };
  };

  useEffect(() => {
    if (!user) return;

    // Fetch in parallel
    fetchProfile();
    fetchMessages();

    const cleanup = subscribeToMessages();

    return () => {
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // sendMessage function remains largely the same, but relies on the improved profile check

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    // CRITICAL CHECK: ensure user and profileId are available
    if (!user || !profileId) {
      if (!profileId) {
        console.warn('Cannot send message: profileId is missing.');
        toast({
          title: 'Error',
          description: 'Your profile is not set up. Please complete your profile before sending messages.',
          variant: 'destructive',
        });
      }
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase.from('spark_room_messages').insert({
        room_id: roomId,
        user_id: user.id, // Good to keep this, though 'profiles' table uses profile_id
        profile_id: profileId, // This is the required foreign key to 'profiles'
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      // ... existing error handling
    } finally {
      setSending(false);
    }
  };

  return (
    // ... JSX rendering remains the same
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{roomName}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                // Ensure msg.profile exists before checking its ID
                const isOwnMessage = msg.profile && msg.profile.id === profileId;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* CRITICAL: Safe check for msg.profile */}
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={msg.profile?.profile_pic_url || undefined} />
                      <AvatarFallback>{msg.profile?.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>

                    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} flex-1 max-w-[70%]`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {/* CRITICAL: Safe access to msg.profile.name */}
                          {isOwnMessage ? 'You' : msg.profile?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <div className="flex-shrink-0 p-4 border-t">
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending || !profileId} // Disable if profileId is missing
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !newMessage.trim() || !profileId}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
