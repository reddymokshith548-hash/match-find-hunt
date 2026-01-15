import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar, Users, Plus, Video, Search, Clock, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import SparkRoomChat from '@/components/SparkRoomChat';

interface SparkRoom {
  id: string;
  name: string;
  description?: string;
  topic?: string;
  is_public: boolean;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
}

export default function SparkRooms() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<SparkRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    topic: '',
    is_public: true,
  });
  const [selectedRoom, setSelectedRoom] = useState<{ id: string; name: string; description?: string; topic?: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user]);

  const fetchRooms = async () => {
    try {
      const { data: roomsData, error: roomsError } = await supabase
        .from('spark_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (roomsError) throw roomsError;

      // Get member counts and check if user is a member
      const roomsWithCounts = await Promise.all(
        (roomsData || []).map(async (room) => {
          const { count } = await supabase
            .from('spark_room_members')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);

          const { data: memberData } = await supabase
            .from('spark_room_members')
            .select('id')
            .eq('room_id', room.id)
            .eq('user_id', user?.id)
            .single();

          return {
            ...room,
            member_count: count || 0,
            is_member: !!memberData,
          };
        })
      );

      setRooms(roomsWithCounts);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Spark Rooms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!user || !newRoom.name.trim()) {
      toast({
        title: 'Error',
        description: 'Room name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: room, error: roomError } = await supabase
        .from('spark_rooms')
        .insert({
          name: newRoom.name,
          description: newRoom.description || null,
          topic: newRoom.topic || null,
          is_public: newRoom.is_public,
          creator_id: user.id,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Auto-join the creator
      const { error: memberError } = await supabase
        .from('spark_room_members')
        .insert({
          room_id: room.id,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      toast({
        title: 'Room created!',
        description: 'Your Spark Room is ready',
      });

      setCreateDialogOpen(false);
      setNewRoom({ name: '', description: '', topic: '', is_public: true });
      fetchRooms();
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: 'Error',
        description: 'Failed to create room',
        variant: 'destructive',
      });
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('spark_room_members')
        .insert({
          room_id: roomId,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Joined!',
        description: 'You are now a member of this Spark Room',
      });

      fetchRooms();
    } catch (error: any) {
      console.error('Error joining room:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to join room',
        variant: 'destructive',
      });
    }
  };

  const leaveRoom = async (roomId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('spark_room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Left room',
        description: 'You are no longer a member',
      });

      fetchRooms();
    } catch (error) {
      console.error('Error leaving room:', error);
      toast({
        title: 'Error',
        description: 'Failed to leave room',
        variant: 'destructive',
      });
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.topic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading Spark Rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text flex items-center gap-3">
              <Video className="h-8 w-8" />
              Spark Rooms
            </h1>
            <p className="text-muted-foreground mt-2">
              Join virtual events and connect with the community
            </p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Spark Room</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Room Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Founder Coffee Chat"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., SaaS, B2B, Marketing"
                    value={newRoom.topic}
                    onChange={(e) => setNewRoom({ ...newRoom, topic: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What's this room about?"
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <Button onClick={createRoom} className="w-full">
                  Create Room
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <Card key={room.id} className="hover-scale">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{room.name}</CardTitle>
                    {room.topic && (
                      <Badge variant="secondary" className="mb-2">
                        {room.topic}
                      </Badge>
                    )}
                  </div>
                  {room.is_public && (
                    <Badge variant="outline" className="ml-2">Public</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {room.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {room.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{room.member_count} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDistanceToNow(new Date(room.created_at), { addSuffix: true })}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {room.is_member ? (
                    <>
                      <Button
                        variant="default"
                        className="flex-1"
                        onClick={() => setSelectedRoom({ id: room.id, name: room.name, description: room.description, topic: room.topic })}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => leaveRoom(room.id)}
                      >
                        Leave
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => joinRoom(room.id)}
                    >
                      Join Room
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No rooms found' : 'No Spark Rooms yet. Create the first one!'}
            </p>
          </div>
        )}
      </div>

      {/* Full-screen Chat View */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 bg-background">
          <SparkRoomChat
            roomId={selectedRoom.id}
            roomName={selectedRoom.name}
            roomDescription={selectedRoom.description}
            roomTopic={selectedRoom.topic}
            onClose={() => setSelectedRoom(null)}
            onLeaveRoom={() => {
              leaveRoom(selectedRoom.id);
              setSelectedRoom(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
