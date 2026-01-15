import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Users, Loader2, Hash, LogOut, Smile, Paperclip, MoreVertical, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { format, isToday, isYesterday } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

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
  onLeaveRoom?: () => void;
  showHeader?: boolean;
}

export default function SparkRoomChat({
  roomId,
  roomName,
  onClose,
  onProfileClick,
  onLeaveRoom,
  showHeader = true,
}: SparkRoomChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      inputRef.current?.focus();
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

  // Format date for separators
  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  // Group messages by date
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; displayDate: string; messages: Message[] }[] = [];
    let currentDate = '';

    msgs.forEach((msg) => {
      const msgDate = new Date(msg.created_at).toLocaleDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ 
          date: currentDate, 
          displayDate: formatDateSeparator(msg.created_at),
          messages: [msg] 
        });
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
      {showHeader && (
        <div className="flex-shrink-0 border-b px-4 py-3 flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">{roomName}</h2>
              <p className="text-xs text-muted-foreground">{members.length} members</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Room Info Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5 text-primary" />
                    {roomName}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Members ({members.length})
                  </h4>
                  <div className="space-y-2">
                    {members.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => onProfileClick?.(member.id)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.profile_pic_url || undefined} />
                          <AvatarFallback>
                            {member.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.name}</span>
                        {member.id === profileId && (
                          <Badge variant="secondary" className="ml-auto">You</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {onLeaveRoom && (
                    <Button
                      variant="destructive"
                      className="w-full mt-6"
                      onClick={onLeaveRoom}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Leave Room
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Users className="h-4 w-4 mr-2" />
                  View Members
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {onLeaveRoom && (
                  <DropdownMenuItem onClick={onLeaveRoom} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Leave Room
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground mt-1">Be the first to say hello!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messageGroups.map((group) => (
                <div key={group.date}>
                  {/* Date Separator */}
                  <div className="flex items-center justify-center my-6">
                    <div className="bg-muted px-4 py-1.5 rounded-full shadow-sm">
                      <span className="text-xs font-medium text-muted-foreground">
                        {group.displayDate}
                      </span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="space-y-1">
                    {group.messages.map((msg, idx) => {
                      const isOwnMessage = msg.profile?.id === profileId;
                      const profileName = msg.profile?.name || 'Unknown User';
                      const senderId = msg.profile?.id;
                      const prevMsg = group.messages[idx - 1];
                      const isFirstFromSender = !prevMsg || prevMsg.profile?.id !== msg.profile?.id;
                      const nextMsg = group.messages[idx + 1];
                      const isLastFromSender = !nextMsg || nextMsg.profile?.id !== msg.profile?.id;

                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex gap-2 px-2',
                            isOwnMessage ? 'flex-row-reverse' : 'flex-row',
                            isFirstFromSender && 'mt-3'
                          )}
                        >
                          {/* Avatar */}
                          <div className="w-8 flex-shrink-0">
                            {isFirstFromSender && !isOwnMessage && (
                              <button
                                onClick={() => senderId && onProfileClick?.(senderId)}
                                className="focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
                                disabled={!senderId || !onProfileClick}
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={msg.profile?.profile_pic_url || undefined} />
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {profileName.charAt(0) || '?'}
                                  </AvatarFallback>
                                </Avatar>
                              </button>
                            )}
                          </div>

                          <div
                            className={cn(
                              'flex flex-col max-w-[75%]',
                              isOwnMessage ? 'items-end' : 'items-start'
                            )}
                          >
                            {/* Name */}
                            {isFirstFromSender && !isOwnMessage && (
                              <span
                                className="text-xs font-semibold text-primary mb-1 ml-1 cursor-pointer hover:underline"
                                onClick={() => senderId && onProfileClick?.(senderId)}
                              >
                                {profileName}
                              </span>
                            )}

                            {/* Message Bubble */}
                            <div
                              className={cn(
                                'px-4 py-2 max-w-full shadow-sm',
                                isOwnMessage
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-card border',
                                // Bubble shape based on position
                                isFirstFromSender && isLastFromSender
                                  ? isOwnMessage
                                    ? 'rounded-2xl rounded-br-md'
                                    : 'rounded-2xl rounded-bl-md'
                                  : isFirstFromSender
                                    ? isOwnMessage
                                      ? 'rounded-2xl rounded-br-md'
                                      : 'rounded-2xl rounded-bl-md'
                                    : isLastFromSender
                                      ? isOwnMessage
                                        ? 'rounded-2xl rounded-tr-md'
                                        : 'rounded-2xl rounded-tl-md'
                                      : isOwnMessage
                                        ? 'rounded-2xl rounded-r-md'
                                        : 'rounded-2xl rounded-l-md'
                              )}
                            >
                              <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">
                                {msg.message}
                              </p>
                              <span 
                                className={cn(
                                  "text-[10px] mt-1 block text-right",
                                  isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                                )}
                              >
                                {format(new Date(msg.created_at), 'HH:mm')}
                              </span>
                            </div>
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
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="flex-shrink-0 p-3 border-t bg-card">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending || !profileId}
              className="pr-20 py-6 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
              autoComplete="off"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Smile className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={sending || !newMessage.trim() || !profileId}
            size="icon"
            className="h-12 w-12 rounded-full flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

// Helper component for empty state
const MessageCircle = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
  </svg>
);