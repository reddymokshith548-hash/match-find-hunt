import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Conversation {
  id: string;
  connection_id: string;
  other_user: {
    id: string;
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
}

export default function Messages() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.connection_id);
      subscribeToMessages(selectedConversation.connection_id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Get all connections where both users have signed NDA
      const { data: connections, error } = await supabase
        .from('connections')
        .select(`
          id,
          user1_id,
          user2_id,
          status
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      // For each connection, check if both users signed NDA
      const conversationsWithNDA = await Promise.all(
        (connections || []).map(async (conn) => {
          const { data: signatures } = await supabase
            .from('nda_signatures')
            .select('user_id')
            .eq('connection_id', conn.id);

          const bothSigned = signatures && signatures.length === 2;
          
          if (!bothSigned) return null;

          const otherUserId = conn.user1_id === user.id ? conn.user2_id : conn.user1_id;

          // Get other user's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, profile_pic_url, user_id')
            .eq('user_id', otherUserId)
            .single();

          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('connection_id', conn.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            id: conn.id,
            connection_id: conn.id,
            other_user: {
              id: otherUserId,
              name: profile?.name || 'Unknown',
              profile_pic_url: profile?.profile_pic_url
            },
            last_message: lastMsg?.content,
            last_message_time: lastMsg?.created_at,
            unread_count: 0
          };
        })
      );

      const validConversations = conversationsWithNDA.filter(
        (conv) => conv !== null
      ) as Conversation[];

      setConversations(validConversations);

      // Auto-select first conversation if available
      if (validConversations.length > 0 && !selectedConversation) {
        setSelectedConversation(validConversations[0]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    }
  };

  const fetchMessages = async (connectionId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('connection_id', connectionId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = (connectionId: string) => {
    const channel = supabase
      .channel(`messages:${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedConversation.other_user.id,
          content: newMessage.trim(),
          connection_id: selectedConversation.connection_id,
          is_read: false
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold gradient-text">Messages</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <ScrollArea className="h-full">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Connect with people and sign NDAs to start chatting!
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 flex items-center space-x-3 rounded-lg transition-colors ${
                        selectedConversation?.id === conv.id
                          ? 'bg-accent'
                          : 'hover:bg-accent/50'
                      }`}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conv.other_user.profile_pic_url} />
                        <AvatarFallback>{conv.other_user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold">{conv.other_user.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message || 'No messages yet'}
                        </p>
                      </div>
                      {conv.last_message_time && (
                        <span className="text-xs text-muted-foreground">
                          {formatTime(conv.last_message_time)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversation.other_user.profile_pic_url} />
                    <AvatarFallback>
                      {selectedConversation.other_user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold">{selectedConversation.other_user.name}</h3>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {messages.map((message) => {
                    const isSender = message.sender_id === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex mb-4 ${isSender ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isSender
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      disabled={loading}
                    />
                    <Button onClick={handleSendMessage} disabled={loading || !newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-muted-foreground text-sm">
                  Choose a conversation from the left to start messaging
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
