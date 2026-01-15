import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Plus, Search, Clock, MessageCircle, ArrowLeft, Hash, Settings, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import SparkRoomChat from '@/components/SparkRoomChat';
import { cn } from '@/lib/utils';

interface SparkRoom {
  id: string;
  name: string;
  description?: string;
  topic?: string;
  is_public: boolean;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
  last_message?: string;
  last_message_time?: string;
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
  const [selectedRoom, setSelectedRoom] = useState<SparkRoom | null>(null);
  const [activeTab, setActiveTab] = useState<'my-rooms' | 'discover'>('my-rooms');

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

      // Get member counts, check membership, and get last message
      const roomsWithDetails = await Promise.all(
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

          // Get last message
          const { data: lastMessageData } = await supabase
            .from('spark_room_messages')
            .select('message, created_at')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...room,
            member_count: count || 0,
            is_member: !!memberData,
            last_message: lastMessageData?.message,
            last_message_time: lastMessageData?.created_at,
          };
        })
      );

      setRooms(roomsWithDetails);
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
      
      // Auto-select the new room
      setSelectedRoom({ ...room, member_count: 1, is_member: true });
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: 'Error',
        description: 'Failed to create room',
        variant: 'destructive',
      });
    }
  };

  const joinRoom = async (room: SparkRoom) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('spark_room_members')
        .insert({
          room_id: room.id,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Joined!',
        description: 'You are now a member of this Spark Room',
      });

      // Update local state and select the room
      const updatedRoom = { ...room, is_member: true, member_count: (room.member_count || 0) + 1 };
      setRooms(prev => prev.map(r => r.id === room.id ? updatedRoom : r));
      setSelectedRoom(updatedRoom);
      setActiveTab('my-rooms');
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

      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null);
      }
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

  const myRooms = rooms.filter(room => room.is_member);
  const discoverRooms = rooms.filter(room => 
    !room.is_member && 
    (room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.topic?.toLowerCase().includes(searchQuery.toLowerCase()))
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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Room List */}
      <div className={cn(
        "w-full md:w-96 border-r bg-card flex flex-col",
        selectedRoom ? "hidden md:flex" : "flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b bg-card/50 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Hash className="h-6 w-6 text-primary" />
              Spark Rooms
            </h1>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Plus className="h-5 w-5" />
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

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="w-full">
              <TabsTrigger value="my-rooms" className="flex-1">
                My Rooms ({myRooms.length})
              </TabsTrigger>
              <TabsTrigger value="discover" className="flex-1">
                Discover
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Room List */}
        <ScrollArea className="flex-1">
          {activeTab === 'my-rooms' ? (
            myRooms.length === 0 ? (
              <div className="p-8 text-center">
                <Hash className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">You haven't joined any rooms yet</p>
                <Button variant="outline" onClick={() => setActiveTab('discover')}>
                  Discover Rooms
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {myRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={cn(
                      "w-full p-4 text-left hover:bg-accent/50 transition-colors flex items-start gap-3",
                      selectedRoom?.id === room.id && "bg-accent"
                    )}
                  >
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Hash className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">{room.name}</h3>
                        {room.last_message_time && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatDistanceToNow(new Date(room.last_message_time), { addSuffix: false })}
                          </span>
                        )}
                      </div>
                      {room.topic && (
                        <Badge variant="secondary" className="text-xs mb-1">
                          {room.topic}
                        </Badge>
                      )}
                      <p className="text-sm text-muted-foreground truncate">
                        {room.last_message || room.description || 'No messages yet'}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{room.member_count} members</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="p-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Discover Grid */}
              <div className="space-y-3">
                {discoverRooms.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No rooms found' : 'No rooms available to join'}
                    </p>
                  </div>
                ) : (
                  discoverRooms.map((room) => (
                    <Card key={room.id} className="hover:bg-accent/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Hash className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">{room.name}</h3>
                              {room.is_public && (
                                <Badge variant="outline" className="text-xs">Public</Badge>
                              )}
                            </div>
                            {room.topic && (
                              <Badge variant="secondary" className="text-xs mb-2">
                                {room.topic}
                              </Badge>
                            )}
                            {room.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {room.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>{room.member_count} members</span>
                              </div>
                              <Button size="sm" onClick={() => joinRoom(room)}>
                                Join
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col",
        !selectedRoom ? "hidden md:flex" : "flex"
      )}>
        {selectedRoom ? (
          <>
            {/* Mobile Back Button */}
            <div className="md:hidden p-2 border-b bg-card">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRoom(null)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Rooms
              </Button>
            </div>
            <SparkRoomChat
              roomId={selectedRoom.id}
              roomName={selectedRoom.name}
              onClose={() => setSelectedRoom(null)}
              onLeaveRoom={() => leaveRoom(selectedRoom.id)}
              showHeader={true}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/30">
            <div className="text-center p-8">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Select a Room</h2>
              <p className="text-muted-foreground max-w-sm">
                Choose a room from the sidebar to start chatting with other founders
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}