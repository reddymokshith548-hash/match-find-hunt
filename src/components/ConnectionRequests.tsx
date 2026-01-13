import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Check, X, Users, MessageSquare, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import MutualNDAModal from './MutualNDAModal';

interface ConnectionRequest {
  id: string;
  user1_id: string;
  user2_id: string;
  status: string;
  created_at: string;
  nda_signed_by_user1: boolean;
  nda_signed_by_user2: boolean;
  requester: {
    id: string;
    name: string;
    role: string;
    profile_pic_url?: string;
  };
}

export default function ConnectionRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [ndaModalOpen, setNdaModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<{
    id: string;
    userName: string;
  } | null>(null);

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

      // Now fetch connection requests where this profile is user2 (receiver)
      const { data, error } = await supabase
        .from('connections')
        .select(`
          id,
          user1_id,
          user2_id,
          status,
          created_at,
          nda_signed_by_user1,
          nda_signed_by_user2,
          requester:profiles!connections_user1_id_fkey(id, name, role, profile_pic_url)
        `)
        .eq('user2_id', profile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data as any || []);
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

  const handleAccept = async (request: ConnectionRequest) => {
    // Open NDA modal for the receiver to sign
    setSelectedConnection({
      id: request.id,
      userName: request.requester.name,
    });
    setNdaModalOpen(true);
  };

  const handleNDAComplete = async () => {
    if (!selectedConnection) return;
    
    // The NDA modal handles the navigation to messages
    // Just clear the state
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

      setRequests(prev => prev.filter(r => r.id !== connectionId));
    } catch (error) {
      console.error('Error rejecting connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject connection',
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Connection Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No pending connection requests</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Connection Requests
          </CardTitle>
          <Badge variant="secondary">{requests.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map(request => (
          <div
            key={request.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={request.requester.profile_pic_url} />
                <AvatarFallback>{request.requester.name?.charAt(0)}</AvatarFallback>
              </Avatar>
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
        ))}
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
