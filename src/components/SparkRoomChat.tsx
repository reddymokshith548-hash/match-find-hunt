import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft, Users, Loader2, Smile, Paperclip, Mic, MoreVertical, Phone, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import SparkRoomInfoDialog from './SparkRoomInfoDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  roomDescription?: string;
  roomTopic?: string;
  onClose: () => void;
  onLeaveRoom: () => void;
  onProfileClick?: (profileId: string) => void;
}

export default function SparkRoomChat({
  roomId,
  roomName,
  roomDescription,
  roomTopic,
  onClose,
  onLeaveRoom,
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
  const [showInfoDialog, setShowInfoDialog] = useState(false);
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

  // Cache profile data to avoid repeated lookups
  const profileCacheRef = useRef<Map<string, Message['profile']>>(new Map());

  // Realtime subscription for messages
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
            const newRow = payload.new as any;
            const pid = newRow?.profile_id;

            // Skip if we already have this message (optimistic insert)
            setMessages((prev) => {
              if (prev.some((m) => m.id === newRow.id)) return prev;

              // Try cache first
              const cached = pid ? profileCacheRef.current.get(pid) : null;
              if (cached) {
                return [...prev, {
                  id: newRow.id,
                  message: newRow.message,
                  created_at: newRow.created_at,
                  profile: cached,
                }];
              }

              // If not cached, add with fallback and fetch async
              const fallback: Message['profile'] = {
                id: pid || 'unknown',
                name: 'Unknown User',
                profile_pic_url: null,
              };

              const tempMsg: Message = {
                id: newRow.id,
                message: newRow.message,
                created_at: newRow.created_at,
                profile: fallback,
              };

              // Fetch profile asynchronously and update
              if (pid) {
                supabase
                  .from('profiles')
                  .select('id, name, profile_pic_url')
                  .eq('id', pid)
                  .maybeSingle()
                  .then(({ data }) => {
                    if (data) {
                      const prof = data as Message['profile'];
                      profileCacheRef.current.set(pid, prof);
                      setMessages((p) =>
                        p.map((m) => m.id === newRow.id ? { ...m, profile: prof } : m)
                      );
                    }
                  });
              }

              return [...prev, tempMsg];
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

  // Realtime subscription for members
  const subscribeToMembers = () => {
    if (!roomId) return () => {};

    const channel = supabase
      .channel(`room-members-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'spark_room_members',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          // Re-fetch members on any change
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  useEffect(() => {
    if (!user) return;
    fetchProfile();
    fetchMessages();
    fetchMembers();
    const cleanupMessages = subscribeToMessages();
    const cleanupMembers = subscribeToMembers();
    return () => {
      if (cleanupMessages) cleanupMessages();
      if (cleanupMembers) cleanupMembers();
    };
  }, [user, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Send message with optimistic update
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

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Get current profile info from cache or create fallback
    const myProfile: Message['profile'] = profileCacheRef.current.get(profileId) || {
      id: profileId,
      name: 'You',
      profile_pic_url: null,
    };

    // Optimistic insert - show message immediately
    const optimisticMsg: Message = {
      id: tempId,
      message: messageText,
      created_at: new Date().toISOString(),
      profile: myProfile,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');
    inputRef.current?.focus();
    setSending(true);

    try {
      const { data, error } = await supabase
        .from('spark_room_messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          profile_id: profileId,
          message: messageText,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Replace temp ID with real ID so realtime dedup works
      if (data) {
        setMessages((prev) =>
          prev.map((m) => m.id === tempId ? { ...m, id: data.id } : m)
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(messageText); // Restore the message text
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

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return dateStr;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* WhatsApp-style Header */}
      <div className="flex-shrink-0 bg-primary text-primary-foreground px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-primary-foreground hover:bg-primary-foreground/10 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Group Avatar & Info - Clickable */}
          <button
            onClick={() => setShowInfoDialog(true)}
            className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
          >
            <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-base truncate">{roomName}</h2>
              <p className="text-xs opacity-80 truncate">
                {members.length} participants
              </p>
            </div>
          </button>

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Video className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Phone className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowInfoDialog(true)}>
                  Group info
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowInfoDialog(true)}>
                  Group media
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onLeaveRoom}
                  className="text-destructive focus:text-destructive"
                >
                  Exit group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages Area with Chat Background Pattern */}
      <div className="flex-1 overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iIzBhMGEwYSI+PC9yZWN0Pgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiIGZpbGw9IiMxYTFhMWEiPjwvY2lyY2xlPgo8L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iIzBhMGEwYSI+PC9yZWN0Pgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiIGZpbGw9IiMxYTFhMWEiPjwvY2lyY2xlPgo8L3N2Zz4=')] bg-muted/30">
        <ScrollArea className="h-full">
          <div className="p-4 min-h-full">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center p-6 bg-card/80 backdrop-blur-sm rounded-lg shadow-sm">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{roomName}</h3>
                  {roomTopic && (
                    <Badge variant="secondary" className="mb-2">
                      {roomTopic}
                    </Badge>
                  )}
                  <p className="text-sm text-muted-foreground">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messageGroups.map((group) => (
                  <div key={group.date}>
                    {/* Date Separator - WhatsApp Style */}
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-card/90 backdrop-blur-sm px-4 py-1.5 rounded-lg shadow-sm">
                        <span className="text-xs font-medium text-muted-foreground">
                          {getDateLabel(group.date)}
                        </span>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="space-y-1">
                      {group.messages.map((msg, idx) => {
                        const isOwnMessage = msg.profile?.id === profileId;
                        const profileName = msg.profile?.name || 'Unknown User';
                        const senderId = msg.profile?.id;
                        const showName =
                          !isOwnMessage &&
                          (idx === 0 ||
                            group.messages[idx - 1]?.profile?.id !== msg.profile?.id);

                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              'flex',
                              isOwnMessage ? 'justify-end' : 'justify-start'
                            )}
                          >
                            <div
                              className={cn(
                                'relative max-w-[85%] sm:max-w-[70%] px-3 py-2 rounded-lg shadow-sm',
                                isOwnMessage
                                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                                  : 'bg-card rounded-bl-sm'
                              )}
                            >
                              {/* Sender Name */}
                              {showName && (
                                <button
                                  onClick={() => senderId && onProfileClick?.(senderId)}
                                  className="text-xs font-semibold text-primary mb-1 hover:underline block"
                                >
                                  {profileName}
                                </button>
                              )}

                              {/* Message Text */}
                              <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">
                                {msg.message}
                              </p>

                              {/* Time */}
                              <span
                                className={cn(
                                  'text-[10px] float-right mt-1 ml-3',
                                  isOwnMessage
                                    ? 'text-primary-foreground/70'
                                    : 'text-muted-foreground'
                                )}
                              >
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
          </div>
        </ScrollArea>
      </div>

      {/* WhatsApp-style Input Area */}
      <div className="flex-shrink-0 bg-card border-t px-2 py-2">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          {/* Emoji Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <Smile className="h-5 w-5" />
          </Button>

          {/* Attachment Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          {/* Input */}
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
            disabled={sending || !profileId}
            className="flex-1 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
            autoComplete="off"
          />

          {/* Send or Voice Button */}
          {newMessage.trim() ? (
            <Button
              type="submit"
              disabled={sending || !newMessage.trim() || !profileId}
              size="icon"
              className="rounded-full flex-shrink-0"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </form>
      </div>

      {/* Group Info Dialog */}
      <SparkRoomInfoDialog
        open={showInfoDialog}
        onOpenChange={setShowInfoDialog}
        roomId={roomId}
        onLeaveRoom={onLeaveRoom}
        onProfileClick={onProfileClick}
      />
    </div>
  );
}
