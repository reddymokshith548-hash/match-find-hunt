import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Users, Clock, Send, Inbox, Loader2 } from 'lucide-react';
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

export default function ConnectionRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [receivedRequests, setReceivedRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [ndaModalOpen, setNdaModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<{
    id: string;
    userName: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('received');

  useEffect(() => {
    if (user) {
      fetchProfileAndRequests();
      const cleanup = subscribeToConnections();
      return cleanup;
    }
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
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;
      setReceivedRequests(received as any || []);

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
      setSentRequests(sent as any || []);

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
    });
    setNdaModalOpen(true);
  };

  const handleNDAComplete = async () => {
    if (!selectedConnection || !user) return;
    
    // Get requester's email for notification
    try {
      const connection = receivedRequests.find(r => r.id === selectedConnection.id);
      if (connection) {
        // Get the requester's user_id and email
        const { data: requesterProfile } = await supabase
          .from('profiles')
          .select('user_id, name')
          .eq('id', connection.user1_id)
          .single();

        if (requesterProfile) {
          // Get current user's profile name
          const { data: myProfile } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', user.id)
            .single();

          // Get requester's email from auth
          const { data: { user: requesterUser } } = await supabase.auth.admin?.getUserById?.(requesterProfile.user_id) || { data: { user: null } };
          
          // Since we can't access admin API from client, we'll use the profile lookup
          // For now, we'll note the email should be sent from the server side
          console.log(`Connection accepted - notification would be sent to ${requesterProfile.name}`);
        }
      }
    } catch (err) {
      console.error('Error sending acceptance notification:', err);
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Connection Requests
        </CardTitle>
      </CardHeader>
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
              receivedRequests.map(request => (
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
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
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
                      Accept
                    </Button>
                  </div>
                </div>
              ))
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
              sentRequests.map(request => (
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
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                    {request.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelRequest(request.id)}
                        className="hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {request.status === 'accepted' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/messages?connection=${request.id}`)}
                      >
                        Chat
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* NDA Modal for accepting connection */}
      {selectedConnection && (
        <MutualNDAModal
          open={ndaModalOpen}
          onOpenChange={(open) => {
            setNdaModalOpen(open);
            if (!open) setSelectedConnection(null);
          }}
          targetUserName={selectedConnection.userName}
          connectionId={selectedConnection.id}
          isInitiator={false}
          onAccept={handleNDAComplete}
        />
      )}
    </Card>
  );
}
