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
    profile_pic_url?: string;
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    fetchProfile();
    fetchMessages();

    const cleanup = subscribeToMessages();

    // Clean up subscription on unmount or when roomId changes
    return () => {
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfileId((data as any)?.id || null);
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    }
  };

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

      setMessages((data as any) || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!roomId) return () => {};

    // Build channel correctly so we can remove it later
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
          // payload.new.profile_id could be null or not set depending on insert logic
          const profileIdFromPayload = payload.new.profile_id;

          let profileData = null;
          if (profileIdFromPayload) {
            const { data: profileRes } = await supabase
              .from('profiles')
              .select('id, name, profile_pic_url')
              .eq('id', profileIdFromPayload)
              .single();

            profileData = profileRes;
          }

          const newMsg = {
            id: payload.new.id,
            message: payload.new.message,
            created_at: payload.new.created_at,
            profile:
              profileData || { id: '', name: 'Unknown', profile_pic_url: null },
          };

          setMessages((prev) => [...prev, newMsg]);
        } catch (err) {
          console.error('Error handling realtime payload:', err, payload);
        }
      }
    );

    channel.subscribe((status) => {
      // helpful debug output to see if subscription fails or is rejected
      console.debug('Supabase realtime channel status for', roomId, status);
    });

    // Return cleanup function that removes the channel correctly
    return () => {
      try {
        supabase.removeChannel(channel);
        console.debug('Removed supabase channel for room', roomId);
      } catch (err) {
        console.error('Error removing supabase channel:', err);
      }
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !user || !profileId) {
      if (!profileId) {
        console.warn('You do not have a profileId; cannot send message.');
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
        user_id: user.id,
        profile_id: profileId,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
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
                const isOwnMessage = msg.profile.id === profileId;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={msg.profile.profile_pic_url || undefined} />
                      <AvatarFallback>{msg.profile.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>

                    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} flex-1 max-w-[70%]`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {isOwnMessage ? 'You' : msg.profile.name}
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
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
