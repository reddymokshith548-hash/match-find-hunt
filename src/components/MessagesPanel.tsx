import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Send, MessageSquare, Loader2, RefreshCw, Search, X, Menu, ChevronLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/usePresence';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { VoiceRecorder } from '@/components/messages/VoiceRecorder';
import { ImagePicker } from '@/components/messages/ImagePicker';
import { TypingIndicator } from '@/components/messages/TypingIndicator';
import { OnlineStatus } from '@/components/messages/OnlineStatus';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface Conversation {
  id: string;
  connection_id: string;
  other_user: {
    profile_id: string;
    auth_user_id?: string;
    name: string;
    profile_pic_url?: string | null;
  };
  last_message?: string | null;
  last_message_time?: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  message_type?: string;
  media_url?: string | null;
  media_duration_seconds?: number | null;
  delivery_status?: string;
}

interface PendingMessage extends Message {
  tempId: string;
  retryCount: number;
}

interface MessagesPanelProps {
  className?: string;
}

export default function MessagesPanel({ className }: MessagesPanelProps) {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [mobileInboxOpen, setMobileInboxOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const messageChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const { isUserOnline, isUserTyping, setTyping } = usePresence(
    user?.id ?? null,
    selectedConversation?.connection_id ?? null
  );

  useEffect(() => {
    if (user) {
      fetchProfileAndConversations();
    }
    
    return () => {
      // Cleanup channels on unmount
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current);
      }
    };
  }, [user]);

  // Subscribe to connection changes for realtime updates
  useEffect(() => {
    if (!profileId) return;

    // Remove existing channel before creating new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`messages-connections-${profileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections',
        },
        () => {
          fetchProfileAndConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nda_signatures',
        },
        () => {
          fetchProfileAndConversations();
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
  }, [profileId]);

  // Handle deep-link to specific connection
  useEffect(() => {
    const connectionParam = searchParams.get('connection');
    if (connectionParam && conversations.length > 0) {
      const targetConv = conversations.find(c => c.connection_id === connectionParam);
      if (targetConv) {
        setSelectedConversation(targetConv);
        if (isMobile) {
          setMobileInboxOpen(false);
        }
      }
    }
  }, [searchParams, conversations, isMobile]);

  useEffect(() => {
    if (!selectedConversation || !profileId) return;

    let isCancelled = false;
    const connectionId = selectedConversation.connection_id;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('connection_id', connectionId)
          .order('created_at', { ascending: true });

        if (isCancelled) return;

        if (error) {
          console.error('Error fetching messages:', error);
          return;
        }

        setMessages(data || []);

        // Mark messages as read
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('connection_id', connectionId)
          .eq('receiver_id', profileId)
          .eq('is_read', false);

        if (!isCancelled) {
          setConversations(prev =>
            prev.map(c => (c.connection_id === connectionId ? { ...c, unread_count: 0 } : c))
          );
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        if (!isCancelled) {
          setLoadingMessages(false);
        }
      }
    };

    loadMessages();

    // Set up realtime subscription after initial load
    if (messageChannelRef.current) {
      supabase.removeChannel(messageChannelRef.current);
      messageChannelRef.current = null;
    }

    const channel = supabase
      .channel(`messages-realtime-${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`,
        },
        payload => {
          if (isCancelled) return;
          const newMsg = payload.new as Message;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setPendingMessages(prev => prev.filter(p => p.id !== newMsg.id));
        }
      )
      .subscribe();

    messageChannelRef.current = channel;

    return () => {
      isCancelled = true;
      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current);
        messageChannelRef.current = null;
      }
    };
  }, [selectedConversation?.connection_id, profileId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingMessages]);

  // Debounced typing indicator - use ref to avoid causing re-renders
  const isTypingRef = useRef(false);
  const handleTyping = useCallback(() => {
    if (!selectedConversation) return;

    // Only call setTyping if not already typing
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      setTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      setTyping(false);
    }, 2000);
  }, [selectedConversation, setTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchProfileAndConversations = async () => {
    if (!user) return;

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        setLoadingConversations(false);
        return;
      }

      setProfileId(profile.id);

      // Get accepted connections where both users have signed NDA
      const { data: connections, error } = await supabase
        .from('connections')
        .select('id, user1_id, user2_id, status, nda_signed_by_user1, nda_signed_by_user2')
        .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      const validConnections = (connections || []).filter(
        conn => conn.nda_signed_by_user1 && conn.nda_signed_by_user2
      );

      const otherProfileIds = validConnections
        .map(conn => (conn.user1_id === profile.id ? conn.user2_id : conn.user1_id))
        .filter(Boolean);

      if (otherProfileIds.length === 0) {
        setConversations([]);
        setLoadingConversations(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, profile_pic_url, user_id')
        .in('id', otherProfileIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const connectionIds = validConnections.map(c => c.id);
      const { data: allMessages } = await supabase
        .from('messages')
        .select('connection_id, content, created_at, receiver_id, is_read')
        .in('connection_id', connectionIds)
        .order('created_at', { ascending: false });

      const messagesByConnection = new Map<string, { last?: any; unread: number }>();
      allMessages?.forEach(msg => {
        if (!messagesByConnection.has(msg.connection_id!)) {
          messagesByConnection.set(msg.connection_id!, { last: msg, unread: 0 });
        }
        const entry = messagesByConnection.get(msg.connection_id!)!;
        if (!entry.last) entry.last = msg;
        if (msg.receiver_id === profile.id && !msg.is_read) {
          entry.unread++;
        }
      });

      const conversationsData: Conversation[] = validConnections.map(conn => {
        const otherProfileId = conn.user1_id === profile.id ? conn.user2_id : conn.user1_id;
        const otherProfile = profilesMap.get(otherProfileId!);
        const msgData = messagesByConnection.get(conn.id);

        return {
          id: conn.id,
          connection_id: conn.id,
          other_user: {
            profile_id: otherProfileId!,
            auth_user_id: otherProfile?.user_id ?? undefined,
            name: otherProfile?.name || 'Unknown',
            profile_pic_url: otherProfile?.profile_pic_url,
          },
          last_message: msgData?.last?.content,
          last_message_time: msgData?.last?.created_at,
          unread_count: msgData?.unread || 0,
        };
      }).filter(c => c.other_user.profile_id);

      conversationsData.sort((a, b) => {
        if (!a.last_message_time) return 1;
        if (!b.last_message_time) return -1;
        return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
      });

      setConversations(conversationsData);

      const connectionParam = searchParams.get('connection');
      if (connectionParam) {
        const targetConv = conversationsData.find(c => c.connection_id === connectionParam);
        if (targetConv) {
          setSelectedConversation(targetConv);
        } else if (conversationsData.length > 0 && !selectedConversation) {
          setSelectedConversation(conversationsData[0]);
        }
      } else if (conversationsData.length > 0 && !selectedConversation) {
        setSelectedConversation(conversationsData[0]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
    } finally {
      setLoadingConversations(false);
    }
  };

  // fetchMessages and subscribeToMessages are now combined in the useEffect above

  const sendMessage = async (
    content: string,
    messageType: 'text' | 'image' | 'voice' = 'text',
    mediaUrl?: string,
    mediaDuration?: number
  ) => {
    if (!user || !selectedConversation || !profileId) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage: PendingMessage = {
      id: tempId,
      tempId,
      sender_id: profileId,
      receiver_id: selectedConversation.other_user.profile_id,
      content: content || (messageType === 'image' ? '📷 Photo' : '🎤 Voice message'),
      created_at: new Date().toISOString(),
      is_read: false,
      message_type: messageType,
      media_url: mediaUrl,
      media_duration_seconds: mediaDuration,
      delivery_status: 'sending',
      retryCount: 0,
    };

    setPendingMessages(prev => [...prev, tempMessage]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: profileId,
          receiver_id: selectedConversation.other_user.profile_id,
          content: content || '',
          connection_id: selectedConversation.connection_id,
          is_read: false,
          message_type: messageType,
          media_url: mediaUrl,
          media_duration_seconds: mediaDuration,
          delivery_status: 'sent',
        })
        .select()
        .single();

      if (error) throw error;

      // Remove pending message and add the real message
      // The realtime subscription may also add it, but we dedupe by id
      setPendingMessages(prev => prev.filter(p => p.tempId !== tempId));
      setMessages(prev => {
        // Check if already added by realtime
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      });

      setConversations(prev =>
        prev.map(c =>
          c.connection_id === selectedConversation.connection_id
            ? { ...c, last_message: content || tempMessage.content, last_message_time: new Date().toISOString() }
            : c
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setPendingMessages(prev =>
        prev.map(p => (p.tempId === tempId ? { ...p, delivery_status: 'failed' } : p))
      );
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    await sendMessage(newMessage.trim());
    setNewMessage('');
    setSending(false);
  };

  const handleRetryMessage = async (tempId: string) => {
    const pendingMsg = pendingMessages.find(p => p.tempId === tempId);
    if (!pendingMsg || pendingMsg.retryCount >= 3) return;

    setPendingMessages(prev =>
      prev.map(p =>
        p.tempId === tempId ? { ...p, delivery_status: 'sending', retryCount: p.retryCount + 1 } : p
      )
    );

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: pendingMsg.sender_id,
          receiver_id: pendingMsg.receiver_id,
          content: pendingMsg.content,
          connection_id: selectedConversation?.connection_id,
          is_read: false,
          message_type: pendingMsg.message_type,
          media_url: pendingMsg.media_url,
          media_duration_seconds: pendingMsg.media_duration_seconds,
          delivery_status: 'sent',
        })
        .select()
        .single();

      if (error) throw error;

      setPendingMessages(prev => prev.filter(p => p.tempId !== tempId));
      setMessages(prev => {
        // Check if already added by realtime
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
    } catch (error) {
      setPendingMessages(prev =>
        prev.map(p => (p.tempId === tempId ? { ...p, delivery_status: 'failed' } : p))
      );
    }
  };

  const handleImageSelected = async (file: File) => {
    if (!user || !selectedConversation) return;

    setSending(true);

    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('chat-media').upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(fileName);

      await sendMessage('', 'image', urlData.publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleVoiceRecording = async (blob: Blob, duration: number) => {
    if (!user || !selectedConversation) return;

    setSending(true);

    try {
      const fileName = `${user.id}/${Date.now()}-voice.webm`;
      const { error: uploadError } = await supabase.storage.from('chat-media').upload(fileName, blob, { contentType: 'audio/webm' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(fileName);

      await sendMessage('', 'voice', urlData.publicUrl, duration);
    } catch (error) {
      console.error('Error uploading voice:', error);
      toast({ title: 'Error', description: 'Failed to upload voice message', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredMessages = searchQuery
    ? messages.filter(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const allMessages = [...filteredMessages, ...pendingMessages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    if (isMobile) {
      setMobileInboxOpen(false);
    }
  };

  const renderConversationsList = () => (
    <div className="h-full flex flex-col min-h-0">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Conversations</h3>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        {loadingConversations ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6">
            <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
            <p className="text-muted-foreground text-sm">
              Connect with people and sign NDAs to start chatting!
            </p>
            <Button className="mt-4" onClick={fetchProfileAndConversations}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map(conv => {
              if (!conv?.other_user?.profile_id) return null;

              const isOnline = conv.other_user.auth_user_id
                ? isUserOnline(conv.other_user.auth_user_id)
                : false;

              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={cn(
                    'w-full p-4 flex items-center space-x-3 rounded-lg transition-colors',
                    selectedConversation?.id === conv.id ? 'bg-accent' : 'hover:bg-accent/50'
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conv.other_user.profile_pic_url || undefined} />
                      <AvatarFallback>{conv.other_user.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="font-semibold truncate">{conv.other_user.name || 'Unknown'}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.last_message || 'No messages yet'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {conv.last_message_time && (
                      <span className="text-xs text-muted-foreground">{formatTime(conv.last_message_time)}</span>
                    )}
                    {conv.unread_count > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const renderChatArea = () => (
    <Card className="flex-1 flex flex-col h-full min-h-0">
      {selectedConversation ? (
        <>
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isMobile && (
                <Button variant="ghost" size="icon" onClick={() => setMobileInboxOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedConversation.other_user.profile_pic_url || undefined} />
                <AvatarFallback>{selectedConversation.other_user.name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{selectedConversation.other_user.name || 'Unknown'}</h3>
                <OnlineStatus
                  isOnline={
                    selectedConversation.other_user.auth_user_id
                      ? isUserOnline(selectedConversation.other_user.auth_user_id)
                      : false
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {showSearch ? (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-32 sm:w-48"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)}>
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 min-h-0 p-4">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : allMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No messages match your search' : 'No messages yet. Say hello! 👋'}
                </p>
              </div>
            ) : (
              <>
                {allMessages.map(message => {
                  const isPending = 'tempId' in message;
                  const isSender = message.sender_id === profileId;

                  return (
                    <MessageBubble
                      key={message.id}
                      id={message.id}
                      content={message.content}
                      messageType={(message.message_type as 'text' | 'image' | 'voice') || 'text'}
                      mediaUrl={message.media_url}
                      mediaDuration={message.media_duration_seconds}
                      deliveryStatus={isPending ? ((message as PendingMessage).delivery_status as any) : 'delivered'}
                      isSender={isSender}
                      timestamp={message.created_at}
                      onRetry={
                        isPending && (message as PendingMessage).delivery_status === 'failed'
                          ? () => handleRetryMessage((message as PendingMessage).tempId)
                          : undefined
                      }
                    />
                  );
                })}

                {selectedConversation.other_user.auth_user_id &&
                  isUserTyping(selectedConversation.other_user.auth_user_id) && (
                    <TypingIndicator userName={selectedConversation.other_user.name} />
                  )}
              </>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-2">
              <ImagePicker onImageSelected={handleImageSelected} disabled={sending} />
              <VoiceRecorder onRecordingComplete={handleVoiceRecording} disabled={sending} />

              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onInput={handleTyping}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()} size="icon">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          {isMobile && (
            <Button variant="outline" className="mb-4" onClick={() => setMobileInboxOpen(true)}>
              <Menu className="h-4 w-4 mr-2" />
              Open Inbox
            </Button>
          )}
          <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
          <p className="text-muted-foreground text-sm">
            Choose a conversation {isMobile ? 'from the menu' : 'from the left'} to start messaging
          </p>
        </div>
      )}
    </Card>
  );

  // Mobile layout with collapsible sheet
  if (isMobile) {
    return (
      <div className={cn('h-full min-h-0 flex flex-col overflow-hidden', className)}>
        <Sheet open={mobileInboxOpen} onOpenChange={setMobileInboxOpen}>
          <SheetContent side="left" className="w-[300px] p-0">
            {renderConversationsList()}
          </SheetContent>
        </Sheet>
        {renderChatArea()}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0 overflow-hidden', className)}>
      {/* Conversations List */}
      <Card className="lg:col-span-1 flex flex-col min-h-0">
        {renderConversationsList()}
      </Card>

      {/* Chat Area */}
      <div className="lg:col-span-2 flex flex-col min-h-0">
        {renderChatArea()}
      </div>
    </div>
  );
}
