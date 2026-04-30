import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Users, Clock, Send, Inbox, Loader2, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import MutualNDAModal from './MutualNDAModal';
import { ProfileHoverCard } from './ProfileHoverCard';

interface ProfileDetails {
  id: string;
  name: string;
  role: string;
  profile_pic_url?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  interests?: string[];
}

interface ConnectionRequest {
  id: string;
  user1_id: string;
  user2_id: string;
  status: string;
  created_at: string;
  nda_signed_by_user1: boolean;
  nda_signed_by_user2: boolean;
  requester: ProfileDetails;
}

interface SentRequest {
  id: string;
  user1_id: string;
  user2_id: string;
  status: string;
  created_at: string;
  nda_signed_by_user1: boolean;
  nda_signed_by_user2: boolean;
  recipient: ProfileDetails;
}

interface AcceptedConnection {
  id: string;
  user1_id: string;
  user2_id: string;
  status: string;
  created_at: string;
  nda_signed_by_user1: boolean;
  nda_signed_by_user2: boolean;
  other_user: ProfileDetails;
  isReceivedRequest: boolean; // true if current user is user2 (received the request)
}

export default function ConnectionRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [receivedRequests, setReceivedRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [acceptedConnections, setAcceptedConnections] = useState<AcceptedConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [ndaModalOpen, setNdaModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<{
    id: string;
    userName: string;
    isInitiator: boolean;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('received');
  // Collapsed by default to give the matches list more vertical room.
  // Auto-expands when there is something actionable (received requests or a deep-link).
  const [collapsed, setCollapsed] = useState<boolean>(true);

  // Handle deep-link to specific connection (for NDA signing from notifications)
  useEffect(() => {
    const connectionParam = searchParams.get('connection');
    if (connectionParam && profileId && !loading) {
      // Deep-link → make sure the panel is open
      setCollapsed(false);
      // Find the connection and open NDA modal
      const sentRequest = sentRequests.find(r => r.id === connectionParam);
      const receivedRequest = receivedRequests.find(r => r.id === connectionParam);
      
      if (sentRequest) {
        setActiveTab('sent');
        // If sender and recipient signed, go to messages
        if (sentRequest.nda_signed_by_user1 && sentRequest.nda_signed_by_user2) {
          navigate(`/messages?connection=${connectionParam}`);
        } else {
          // Open NDA modal
          setSelectedConnection({
            id: sentRequest.id,
            userName: sentRequest.recipient.name,
            isInitiator: true,
          });
          setNdaModalOpen(true);
        }
      } else if (receivedRequest) {
        setActiveTab('received');
        // Open NDA modal
        setSelectedConnection({
          id: receivedRequest.id,
          userName: receivedRequest.requester.name,
          isInitiator: false,
        });
        setNdaModalOpen(true);
      }
    }
  }, [searchParams, sentRequests, receivedRequests, profileId, loading]);

  useEffect(() => {
    if (user) {
      fetchProfileAndRequests();
      const cleanup = subscribeToConnections();
      return cleanup;
    }
  }, [user]);

  // Listen for client-side connection events. Optimistic events let the Sent
  // tab update the instant the user taps Send; the server-confirmed event
  // then refetches and reconciles. This keeps the UI snappy even if Realtime
  // is delayed or temporarily disconnected.
  useEffect(() => {
    if (!user) return;
    const refresh = () => fetchProfileAndRequests();

    const onOptimisticSent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.tempId || !detail?.recipient) return;
      const optimistic: SentRequest = {
        id: detail.tempId,
        user1_id: detail.fromProfileId,
        user2_id: detail.recipient.id,
        status: 'pending',
        created_at: new Date().toISOString(),
        nda_signed_by_user1: false,
        nda_signed_by_user2: false,
        recipient: {
          id: detail.recipient.id,
          name: detail.recipient.name || 'Unknown',
          role: detail.recipient.role || '',
          profile_pic_url: detail.recipient.profile_pic_url,
          bio: detail.recipient.bio,
          location: detail.recipient.location,
          skills: detail.recipient.skills || [],
          interests: detail.recipient.interests || [],
        },
      };
      // Prepend (avoid duplicate if a real row already exists for same recipient).
      setSentRequests(prev => {
        if (prev.some(r => r.recipient?.id === optimistic.recipient.id)) return prev;
        return [optimistic, ...prev];
      });
      setActiveTab('sent');
      setCollapsed(false);
    };

    const onReconcile = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.tempId) return;
      // Swap the temp id for the real id; a refetch will fill in any
      // server-side fields we don't know about yet.
      setSentRequests(prev =>
        prev.map(r => (r.id === detail.tempId ? { ...r, id: detail.realId || r.id } : r))
      );
      fetchProfileAndRequests();
    };

    const onRollback = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.tempId) return;
      setSentRequests(prev => prev.filter(r => r.id !== detail.tempId));
    };

    window.addEventListener('connections:optimistic-sent', onOptimisticSent);
    window.addEventListener('connections:reconcile', onReconcile);
    window.addEventListener('connections:rollback', onRollback);
    window.addEventListener('connections:changed', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('connections:optimistic-sent', onOptimisticSent);
      window.removeEventListener('connections:reconcile', onReconcile);
      window.removeEventListener('connections:rollback', onRollback);
      window.removeEventListener('connections:changed', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [user]);

  const fetchProfileAndRequests = async () => {
    if (!user) return;

    try {
      // First get the user's profile ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        setLoading(false);
        return;
      }

      setProfileId(profile.id);

      // Fetch received requests (where this profile is user2)
      // Include pending AND accepted (where NDA flow may be incomplete)
      const { data: received, error: receivedError } = await supabase
        .from('connections')
        .select(`
          id,
          user1_id,
          user2_id,
          status,
          created_at,
          nda_signed_by_user1,
          nda_signed_by_user2,
          requester:profiles!connections_user1_id_fkey(id, name, role, profile_pic_url, bio, location, skills, interests)
        `)
        .eq('user2_id', profile.id)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;
      
      // Filter out connections with null requester profiles
      // Also filter out fully-signed accepted connections (they belong in messages)
      const validReceived = (received || []).filter((r: any) => {
        if (!r || !r.id || !r.requester || !r.requester.id) return false;
        // Exclude if both have signed NDA (chat is ready)
        if (r.status === 'accepted' && r.nda_signed_by_user1 && r.nda_signed_by_user2) return false;
        return true;
      });
      setReceivedRequests(validReceived as ConnectionRequest[]);
      // Auto-expand if there are received requests waiting on the user.
      if ((validReceived || []).length > 0) {
        setCollapsed(false);
      }

      // Fetch sent requests (where this profile is user1)
      const { data: sent, error: sentError } = await supabase
        .from('connections')
        .select(`
          id,
          user1_id,
          user2_id,
          status,
          created_at,
          nda_signed_by_user1,
          nda_signed_by_user2,
          recipient:profiles!connections_user2_id_fkey(id, name, role, profile_pic_url, bio, location, skills, interests)
        `)
        .eq('user1_id', profile.id)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;
      
      // Filter out connections with null recipient profiles
      // Also filter out fully-signed accepted connections (they belong in messages)
      const validSent = (sent || []).filter((r: any) => {
        if (!r || !r.id || !r.recipient || !r.recipient.id) return false;
        // Exclude if both have signed NDA (chat is ready)
        if (r.status === 'accepted' && r.nda_signed_by_user1 && r.nda_signed_by_user2) return false;
        return true;
      });
      setSentRequests(validSent as SentRequest[]);

    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToConnections = () => {
    const channel = supabase
      .channel('connection-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections',
        },
        () => {
          fetchProfileAndRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'nda_signatures',
        },
        () => {
          // Refetch when NDA signatures are added
          fetchProfileAndRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendEmailNotification = async (
    type: 'connection_request' | 'connection_accepted',
    recipientEmail: string,
    recipientName: string,
    senderName: string
  ) => {
    try {
      const { error } = await supabase.functions.invoke('send-connection-email', {
        body: {
          type,
          recipientEmail,
          recipientName,
          senderName,
        },
      });

      if (error) {
        console.error('Error sending email notification:', error);
      } else {
        console.log(`Email notification (${type}) sent successfully`);
      }
    } catch (err) {
      console.error('Failed to send email notification:', err);
    }
  };

  const handleAccept = async (request: ConnectionRequest) => {
    // Open NDA modal for the receiver to sign
    setSelectedConnection({
      id: request.id,
      userName: request.requester.name,
      isInitiator: false,
    });
    setNdaModalOpen(true);
  };

  const handleChatClick = (connectionId: string, userName: string, isReceivedRequest: boolean) => {
    // For accepted connections, check if NDA is signed
    // If not, open NDA modal, otherwise navigate to messages
    setSelectedConnection({
      id: connectionId,
      userName: userName,
      isInitiator: !isReceivedRequest, // If user received the request, they're not the initiator
    });
    setNdaModalOpen(true);
  };

  const handleNDAComplete = async () => {
    if (!selectedConnection || !user) {
      setSelectedConnection(null);
      fetchProfileAndRequests();
      return;
    }
    
    try {
      // Check if both NDAs are now signed
      const { data: connection } = await supabase
        .from('connections')
        .select('nda_signed_by_user1, nda_signed_by_user2, status')
        .eq('id', selectedConnection.id)
        .single();
      
      if (connection && connection.nda_signed_by_user1 && connection.nda_signed_by_user2) {
        // Both signed - navigate to messages
        navigate(`/messages?connection=${selectedConnection.id}`);
      }
    } catch (error) {
      console.error('Error checking NDA completion:', error);
    }
    
    setSelectedConnection(null);
    fetchProfileAndRequests();
  };

  const handleReject = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'rejected' })
        .eq('id', connectionId);

      if (error) throw error;

      toast({
        title: 'Connection rejected',
        description: 'Connection request declined',
      });

      setReceivedRequests(prev => prev.filter(r => r.id !== connectionId));
    } catch (error) {
      console.error('Error rejecting connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject connection',
        variant: 'destructive',
      });
    }
  };

  const handleCancelRequest = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      toast({
        title: 'Request cancelled',
        description: 'Your connection request has been withdrawn',
      });

      setSentRequests(prev => prev.filter(r => r.id !== connectionId));
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel request',
        variant: 'destructive',
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
      case 'accepted':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Accepted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalReceived = receivedRequests.length;
  const totalSent = sentRequests.length;

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setCollapsed((c) => !c)}
      >
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Connection Requests
            {totalReceived > 0 && (
              <Badge variant="secondary" className="ml-1">{totalReceived} new</Badge>
            )}
            {totalSent > 0 && (
              <Badge variant="outline" className="ml-1 text-xs">{totalSent} sent</Badge>
            )}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((c) => !c);
            }}
            aria-label={collapsed ? 'Expand connection requests' : 'Collapse connection requests'}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      {!collapsed && (
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Received
              {totalReceived > 0 && (
                <Badge variant="secondary" className="ml-1">{totalReceived}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Sent
              {totalSent > 0 && (
                <Badge variant="secondary" className="ml-1">{totalSent}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4">
            {receivedRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending connection requests</p>
              </div>
            ) : (
              receivedRequests.map(request => {
                // Skip rendering if requester data is missing
                if (!request || !request.requester || !request.requester.id) return null;
                
                // Determine NDA status for received requests (I am user2)
                const theirNdaSigned = request.nda_signed_by_user1; // They are user1 (sender)
                const myNdaSigned = request.nda_signed_by_user2; // I am user2 (receiver)
                const isAccepted = request.status === 'accepted';
                const needsMySignature = isAccepted && theirNdaSigned && !myNdaSigned;
                const waitingForThem = isAccepted && myNdaSigned && !theirNdaSigned;
                
                return (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ProfileHoverCard
                      profile={{
                        id: request.requester.id,
                        name: request.requester.name,
                        role: request.requester.role,
                        profile_pic_url: request.requester.profile_pic_url,
                        bio: request.requester.bio,
                        location: request.requester.location,
                        skills: request.requester.skills || [],
                        interests: request.requester.interests || [],
                      }}
                      side="right"
                    >
                      <Avatar className="h-12 w-12 cursor-pointer ring-2 ring-transparent hover:ring-primary/50 transition-all">
                        <AvatarImage src={request.requester.profile_pic_url} />
                        <AvatarFallback>{request.requester.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </ProfileHoverCard>
                    <div>
                      <h4 className="font-semibold">{request.requester.name}</h4>
                      <p className="text-sm text-muted-foreground">{request.requester.role}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(request.created_at)}
                        </span>
                        {/* NDA Status Indicator for accepted requests */}
                        {isAccepted && (
                          <>
                            {needsMySignature && (
                              <Badge variant="outline" className="text-xs py-0 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                Sign NDA to chat
                              </Badge>
                            )}
                            {waitingForThem && (
                              <Badge variant="outline" className="text-xs py-0 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                                Waiting for their NDA
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* Pending: Accept/Reject buttons */}
                    {request.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(request.id)}
                          className="hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(request)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept & Sign NDA
                        </Button>
                      </>
                    )}
                    {/* Accepted but needs my NDA signature */}
                    {needsMySignature && (
                      <Button
                        size="sm"
                        onClick={() => handleAccept(request)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Sign NDA to Chat
                      </Button>
                    )}
                    {/* Waiting for their signature */}
                    {waitingForThem && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Awaiting
                      </Badge>
                    )}
                    {/* Accepted but neither signed yet (shouldn't happen but handle it) */}
                    {isAccepted && !theirNdaSigned && !myNdaSigned && (
                      <Button
                        size="sm"
                        onClick={() => handleAccept(request)}
                      >
                        Sign NDA
                      </Button>
                    )}
                  </div>
                </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {sentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Send className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No sent requests</p>
                <p className="text-sm mt-1">Connect with founders from the Matches tab!</p>
              </div>
            ) : (
              sentRequests.map(request => {
                // Skip rendering if recipient data is missing
                if (!request || !request.recipient || !request.recipient.id) return null;
                
                // Determine NDA status for better UX
                const yourNdaSigned = request.nda_signed_by_user1; // You are user1 (sender)
                const theirNdaSigned = request.nda_signed_by_user2; // They are user2 (recipient)
                const bothSigned = yourNdaSigned && theirNdaSigned;
                const waitingForThem = yourNdaSigned && !theirNdaSigned;
                const waitingForYou = !yourNdaSigned && theirNdaSigned;
                
                return (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ProfileHoverCard
                      profile={{
                        id: request.recipient.id,
                        name: request.recipient.name,
                        role: request.recipient.role,
                        profile_pic_url: request.recipient.profile_pic_url,
                        bio: request.recipient.bio,
                        location: request.recipient.location,
                        skills: request.recipient.skills || [],
                        interests: request.recipient.interests || [],
                      }}
                      side="right"
                    >
                      <Avatar className="h-12 w-12 cursor-pointer ring-2 ring-transparent hover:ring-primary/50 transition-all">
                        <AvatarImage src={request.recipient.profile_pic_url} />
                        <AvatarFallback>{request.recipient.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </ProfileHoverCard>
                    <div>
                      <h4 className="font-semibold">{request.recipient.name}</h4>
                      <p className="text-sm text-muted-foreground">{request.recipient.role}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(request.created_at)}
                        </span>
                        {/* NDA Status Indicator */}
                        {request.status === 'accepted' && !bothSigned && (
                          <span className="text-xs">
                            {waitingForThem && (
                              <Badge variant="outline" className="text-xs py-0 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                                Waiting for their NDA
                              </Badge>
                            )}
                            {waitingForYou && (
                              <Badge variant="outline" className="text-xs py-0 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                Sign NDA to chat
                              </Badge>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {request.status === 'pending' && (
                      <>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Pending
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelRequest(request.id)}
                          className="hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {request.status === 'accepted' && bothSigned && (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/messages?connection=${request.id}`)}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Chat
                      </Button>
                    )}
                    {request.status === 'accepted' && waitingForYou && (
                      <Button
                        size="sm"
                        onClick={() => handleChatClick(request.id, request.recipient.name, true)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Sign NDA
                      </Button>
                    )}
                    {request.status === 'accepted' && waitingForThem && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Awaiting
                      </Badge>
                    )}
                    {request.status === 'accepted' && !yourNdaSigned && !theirNdaSigned && (
                      <Button
                        size="sm"
                        onClick={() => handleChatClick(request.id, request.recipient.name, true)}
                      >
                        Sign NDA
                      </Button>
                    )}
                  </div>
                </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      )}

      {/* NDA Modal for accepting connection or starting chat */}
      {selectedConnection && (
        <MutualNDAModal
          open={ndaModalOpen}
          onOpenChange={(open) => {
            setNdaModalOpen(open);
            if (!open) setSelectedConnection(null);
          }}
          targetUserName={selectedConnection.userName}
          connectionId={selectedConnection.id}
          isInitiator={selectedConnection.isInitiator}
          onAccept={handleNDAComplete}
        />
      )}
    </Card>
  );
}
