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
import { Badge } from '@/components/ui/badge'; // 👈 REQUIRED FOR VISIBLE PROFILE
import { cn } from '@/lib/utils'; // 👈 REQUIRED FOR CONDITIONAL CLASSES (e.g., in message bubbles)

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
  // 💡 NEW PROP for clickable profile feature
  onProfileClick: (profileId: string) => void; 
}

export default function SparkRoomChat({ 
  roomId, 
  roomName, 
  onClose,
  onProfileClick // 👈 Destructure new prop
}: SparkRoomChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Profile Fetching Logic (FIXED for robustness) ---
  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      const profileData = data as { id: string, name: string } | null;

      if (!profileData) {
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
  
  // --- Message Fetching Logic ---
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
      setMessages((data as Message[]) || []); 
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


  // --- Realtime Subscription Logic (FIXED for safety) ---
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
          if (profileIdFromPayload) {
            const { data: profileRes, error: profileError } = await supabase
              .from('profiles')
              .select('id, name, profile_pic_url')
              .eq('id', profileIdFromPayload)
              .maybeSingle();

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Error fetching profile for new message:', profileError);
            }
            profileData = profileRes;
          }

          const fallbackProfile: Message['profile'] = { 
            id: profileIdFromPayload || 'unknown', 
            name: 'System/Unknown User', 
            profile_pic_url: null 
          };

          const newMsg: Message = {
            id: (payload.new as any).id,
            message: (payload.new as any).message,
            created_at: (payload.new as any).created_at,
            profile: (profileData as Message['profile'] | null) ?? fallbackProfile,
          };

          setMessages((prev) => [...prev, newMsg]);
        } catch (err) {
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
    fetchProfile();
    fetchMessages();
    const cleanup = subscribeToMessages();
    return () => {if (cleanup) cleanup();};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- Send Message Logic ---
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

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
          {/* Include the close button from your original code */}
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
                const isOwnMessage = msg.profile?.id === profileId;
                const profileName = msg.profile?.name || 'Unknown User';
                const senderId = msg.profile?.id; // Profile ID needed for navigation

                return (
                  <div
                    key={msg.id}
                    className={cn(
                        'flex gap-3', 
                        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    {/* 💡 CLICKABLE AVATAR */}
                    <button 
                        onClick={() => senderId && onProfileClick(senderId)}
                        className="h-8 w-8 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary rounded-full transition-shadow"
                        aria-label={`View profile for ${profileName}`}
                        disabled={!senderId}
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.profile?.profile_pic_url || undefined} />
                            <AvatarFallback>{profileName.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                    </button>

                    <div className={cn(
                        'flex flex-col flex-1 max-w-[70%]',
                        isOwnMessage ? 'items-end' : 'items-start'
                    )}>
                      
                      <div className="flex items-center gap-2 mb-1">
                        {isOwnMessage ? (
                            <span className="text-xs font-medium text-primary">You</span>
                        ) : (
                            // 💡 CLICKABLE NAME BADGE
                            <Badge 
                                variant="outline" 
                                className="cursor-pointer hover:bg-muted-foreground/10 transition-colors px-2 py-0.5"
                                onClick={() => senderId && onProfileClick(senderId)}
                            >
                                <span className="text-xs font-medium">{profileName}</span>
                            </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {/* Message Bubble (Improved rounded corners) */}
                      <div
                        className={cn(
                          'rounded-xl px-3 py-2', 
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground rounded-br-none' // Own message: flat on bottom-right
                            : 'bg-muted rounded-tl-none' // Other's message: flat on top-left
                        )}
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
              disabled={sending || !profileId}
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
