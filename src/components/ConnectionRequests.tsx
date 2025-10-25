import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Check, X, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import NDAModal from './NDAModal';

interface ConnectionRequest {
  id: string;
  user1_id: string;
  user2_id: string;
  status: string;
  created_at: string;
  requester: {
    name: string;
    role: string;
    profile_pic_url?: string;
  };
}

export default function ConnectionRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [ndaModalOpen, setNdaModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<{
    id: string;
    userId: string;
    userName: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchRequests();
      subscribeToConnections();
    }
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('connections')
        .select(`
          id,
          user1_id,
          user2_id,
          status,
          created_at,
          requester:profiles!connections_user1_id_fkey(name, role, profile_pic_url)
        `)
        .eq('user2_id', user.id)
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
          filter: `user2_id=eq.${user?.id}`
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAccept = async (request: ConnectionRequest) => {
    // Check if user has already signed NDA for this connection
    const { data: existingSignature } = await supabase
      .from('nda_signatures')
      .select('id')
      .eq('connection_id', request.id)
      .eq('user_id', user?.id)
      .single();

    if (existingSignature) {
      // Already signed, just accept
      await finalizeAccept(request.id);
    } else {
      // Show NDA modal first
      setSelectedConnection({
        id: request.id,
        userId: request.user1_id,
        userName: request.requester.name
      });
      setNdaModalOpen(true);
    }
  };

  const finalizeAccept = async (connectionId: string) => {
    try {
      // User2 is accepting, so mark their NDA as signed
      const { error } = await supabase
        .from('connections')
        .update({ 
          status: 'accepted',
          nda_signed_by_user2: true,
          user2_accepted_at: new Date().toISOString()
        })
        .eq('id', connectionId);

      if (error) throw error;

      toast({
        title: 'Connection accepted!',
        description: 'You can now message each other',
      });

      setRequests(prev => prev.filter(r => r.id !== connectionId));
    } catch (error) {
      console.error('Error accepting connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept connection',
        variant: 'destructive',
      });
    }
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
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>

      {/* NDA Modal */}
      {selectedConnection && (
        <NDAModal
          open={ndaModalOpen}
          onOpenChange={setNdaModalOpen}
          targetUserId={selectedConnection.userId}
          targetUserName={selectedConnection.userName}
          connectionId={selectedConnection.id}
          onAccept={() => {
            finalizeAccept(selectedConnection.id);
            setSelectedConnection(null);
          }}
        />
      )}
    </Card>
  );
}
