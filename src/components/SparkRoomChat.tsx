import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, X, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  message: string;
  created_at: string;
  profile: {
    id: string;
    name: string;
    profile_pic_url?: string | null;
  };
}

interface RoomMember {
  id: string;
  name: string;
  profile_pic_url?: string | null;
}

export interface SparkRoomChatProps {
  roomId: string;
  roomName: string;
  onClose: () => void;
  onProfileClick?: (profileId: string) => void;
}

export default function SparkRoomChat({
  roomId,
  roomName,
  onClose,
  onProfileClick,
}: SparkRoomChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch profile
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

      const profileData = data as { id: string; name: string } | null;

      if (!profileData) {
        console.warn('Profile not found for authenticated user.');
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
      console.error('Error fetching profile:', err);
    }
  };

  // Fetch room members
  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('spark_room_members')
        .select(`
          id,
          profiles:profiles!spark_room_members_user_id_fkey(id, name, profile_pic_url)
        `)
        .eq('room_id', roomId);

      if (error) throw error;

      const memberList: RoomMember[] = (data || [])
        .map((m: any) => m.profiles)
        .filter(Boolean);

      setMembers(memberList);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  // Fetch messages
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

  // Realtime subscription
  const subscribeToMessages = () => {
    if (!roomId) return () => {};

    // Remove existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`room-${roomId}-${Date.now()}`);

    channel
      .on(
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
              const { data: profileRes } = await supabase
                .from('profiles')
                .select('id, name, profile_pic_url')
                .eq('id', profileIdFromPayload)
                .maybeSingle();

              profileData = profileRes;
            }

            const fallbackProfile: Message['profile'] = {
              id: profileIdFromPayload || 'unknown',
              name: 'Unknown User',
              profile_pic_url: null,
            };

            const newMsg: Message = {
              id: (payload.new as any).id,
              message: (payload.new as any).message,
              created_at: (payload.new as any).created_at,
              profile: (profileData as Message['profile'] | null) ?? fallbackProfile,
            };

            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          } catch (err) {
            console.error('Error handling realtime payload:', err);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  };

  useEffect(() => {
    if (!user) return;
    fetchProfile();
    fetchMessages();
    fetchMembers();
    const cleanup = subscribeToMessages();
    return () => {
      if (cleanup) cleanup();
    };
  }, [user, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    if (!user || !profileId) {
      toast({
        title: 'Error',
        description: 'Please complete your profile before sending messages.',
        variant: 'destructive',
      });
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

  // Group messages by date
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    msgs.forEach((msg) => {
      const msgDate = new Date(msg.created_at).toLocaleDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: currentDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b p-4 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">{roomName}</h2>
            <p className="text-xs text-muted-foreground">{members.length} members</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMembers(!showMembers)}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Members</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messageGroups.map((group) => (
                  <div key={group.date}>
                    {/* Date Separator */}
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-muted px-3 py-1 rounded-full">
                        <span className="text-xs text-muted-foreground">{group.date}</span>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="space-y-3">
                      {group.messages.map((msg, idx) => {
                        const isOwnMessage = msg.profile?.id === profileId;
                        const profileName = msg.profile?.name || 'Unknown User';
                        const senderId = msg.profile?.id;
                        const showAvatar =
                          idx === 0 ||
                          group.messages[idx - 1]?.profile?.id !== msg.profile?.id;

                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              'flex gap-2',
                              isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                            )}
                          >
                            {/* Avatar */}
                            <div className="w-8 flex-shrink-0">
                              {showAvatar && !isOwnMessage && (
                                <button
                                  onClick={() => senderId && onProfileClick?.(senderId)}
                                  className="focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
                                  disabled={!senderId || !onProfileClick}
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={msg.profile?.profile_pic_url || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {profileName.charAt(0) || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                </button>
                              )}
                            </div>

                            <div
                              className={cn(
                                'flex flex-col max-w-[70%]',
                                isOwnMessage ? 'items-end' : 'items-start'
                              )}
                            >
                              {/* Name and time */}
                              {showAvatar && (
                                <div
                                  className={cn(
                                    'flex items-center gap-2 mb-1',
                                    isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                                  )}
                                >
                                  {!isOwnMessage && (
                                    <span
                                      className="text-xs font-medium text-primary cursor-pointer hover:underline"
                                      onClick={() => senderId && onProfileClick?.(senderId)}
                                    >
                                      {profileName}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Message Bubble */}
                              <div
                                className={cn(
                                  'px-4 py-2 rounded-2xl max-w-full',
                                  isOwnMessage
                                    ? 'bg-primary text-primary-foreground rounded-br-md'
                                    : 'bg-muted rounded-bl-md'
                                )}
                              >
                                <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
                              </div>

                              {/* Time */}
                              <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                {new Date(msg.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="flex-shrink-0 p-4 border-t bg-card">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={sending || !profileId}
                className="flex-1"
                autoComplete="off"
              />
              <Button
                type="submit"
                disabled={sending || !newMessage.trim() || !profileId}
                size="icon"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Members Sidebar */}
        {showMembers && (
          <div className="w-64 border-l bg-card flex-shrink-0 hidden sm:block">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Members ({members.length})</h3>
            </div>
            <ScrollArea className="h-[calc(100%-60px)]">
              <div className="p-2">
                {members.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => onProfileClick?.(member.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.profile_pic_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {member.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">{member.name}</span>
                    {member.id === profileId && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        You
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
