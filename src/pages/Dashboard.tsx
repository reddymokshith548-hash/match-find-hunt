import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, MessageSquare, Calendar, Settings, LogOut, ExternalLink, Zap, User, Plus, Video, Search, Clock, MessageCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import LiveMatchmaking from '@/components/LiveMatchmaking';
import SparkMatch from '@/components/SparkMatch';
import ProfileEditor from '@/components/ProfileEditor';
import NotificationCenter from '@/components/NotificationCenter';
import ConnectionRequests from '@/components/ConnectionRequests';
import FounderSyncBanner from '@/components/FounderSyncBanner';
import MessagesPanel from '@/components/MessagesPanel';
import SparkRoomChat from '@/components/SparkRoomChat';
import { ThemeToggle } from '@/components/ThemeToggle';
import { formatDistanceToNow } from 'date-fns';

interface Profile {
  id: string;
  name: string;
  bio: string;
  role: string;
  skills: string[];
  interests: string[];
  location: string;
  age: number;
  match_score: number;
  stage: string;
  looking_for: string[];
  profile_pic_url?: string;
}

interface Opportunity {
  id: string;
  title: string;
  category: string;
  description: string;
  event_date: string;
  link: string;
}

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

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [matches, setMatches] = useState<Profile[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [sparkRooms, setSparkRooms] = useState<SparkRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [showFounderSyncBanner, setShowFounderSyncBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [activeTab, setActiveTab] = useState('spark');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [createRoomDialogOpen, setCreateRoomDialogOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', description: '', topic: '', is_public: true });
  const [selectedRoom, setSelectedRoom] = useState<{ id: string; name: string } | null>(null);

  // Handle tab from URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['spark', 'matches', 'messages', 'opportunities'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchMatches();
      fetchOpportunities();
      fetchSparkRooms();
      checkFounderSyncStatus();
    }
  }, [user]);

  // Check if banner was previously dismissed in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('foundersync_banner_dismissed');
    if (dismissed === 'true') {
      setBannerDismissed(true);
    }
  }, []);

  const checkFounderSyncStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('foundersync_results')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // Show banner if no FounderSync results exist
      setShowFounderSyncBanner(!data);
    } catch (error) {
      console.error('Error checking FounderSync status:', error);
    }
  };

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    sessionStorage.setItem('foundersync_banner_dismissed', 'true');
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // No profile found, redirect to onboarding
        navigate('/onboarding');
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    }
  };

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase.rpc('get_matchmaking_candidates', {
        limit_count: 10,
        exclude_interacted: true
      });
      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const { data, error } = await supabase.from('opportunities').select('*').order('event_date', {
        ascending: true
      }).limit(10);
      if (error) throw error;
      setOpportunities(data || []);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSparkRooms = async () => {
    if (!user) return;
    
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
            .maybeSingle();

          return {
            ...room,
            member_count: count || 0,
            is_member: !!memberData,
          };
        })
      );

      setSparkRooms(roomsWithCounts);
    } catch (error) {
      console.error('Error fetching rooms:', error);
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

      setCreateRoomDialogOpen(false);
      setNewRoom({ name: '', description: '', topic: '', is_public: true });
      fetchSparkRooms();
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

      fetchSparkRooms();
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

      fetchSparkRooms();
    } catch (error) {
      console.error('Error leaving room:', error);
      toast({
        title: 'Error',
        description: 'Failed to leave room',
        variant: 'destructive',
      });
    }
  };

  const filteredRooms = sparkRooms.filter(room =>
    room.name.toLowerCase().includes(roomSearchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(roomSearchQuery.toLowerCase()) ||
    room.topic?.toLowerCase().includes(roomSearchQuery.toLowerCase())
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-background overflow-hidden flex flex-col">
      {/* FounderSync Banner */}
      {showFounderSyncBanner && !bannerDismissed && (
        <FounderSyncBanner onDismiss={handleDismissBanner} />
      )}

      {/* Header */}
      <header className="border-b bg-card shadow-sm shrink-0">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl gradient-text font-bold text-[#59b0bf]">Lexach</h1>
            <div className="hidden md:flex items-center space-x-2">
              <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all" onClick={() => setProfileEditorOpen(true)}>
                <AvatarImage src={profile?.profile_pic_url} />
                <AvatarFallback>{profile?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">Welcome, {profile?.name}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <NotificationCenter />
            <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">My Profile</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="container mx-auto px-4 py-6 h-full flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
            <TabsList className="grid w-full grid-cols-4 lg:w-fit shrink-0 mb-6">
            <TabsTrigger value="spark" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Spark Match</span>
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Matches</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Opportunities</span>
            </TabsTrigger>
          </TabsList>

          {/* Spark Match - Swipe Feature */}
          <TabsContent value="spark" className="flex-1 min-h-0 overflow-y-auto space-y-6">
            <SparkMatch />
          </TabsContent>

          {/* Live AI Matchmaking */}
          <TabsContent value="matches" className="flex-1 min-h-0 overflow-y-auto space-y-6">
            <ConnectionRequests />
            <LiveMatchmaking />
          </TabsContent>

          {/* Messages - Embedded directly */}
          <TabsContent value="messages" className="flex-1 min-h-0 overflow-hidden">
            <MessagesPanel className="h-full" />
          </TabsContent>

          {/* Opportunities with integrated Spark Rooms */}
          <TabsContent value="opportunities" className="flex-1 min-h-0 overflow-y-auto space-y-6">
            {/* Opportunities Section */}
            <div>
              <h2 className="font-bold text-3xl mb-4">Upcoming Opportunities</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {opportunities.map(opportunity => (
                  <Card key={opportunity.id} className="hover-3d">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                          <Badge variant="outline" className="mt-2">
                            {opportunity.category}
                          </Badge>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {new Date(opportunity.event_date).toLocaleDateString()}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm">{opportunity.description}</p>
                      
                      <Button className="w-full" variant="outline" onClick={() => window.open(opportunity.link, '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Learn More
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {opportunities.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No upcoming opportunities</p>
                </div>
              )}
            </div>

            {/* Spark Rooms Section */}
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-bold text-3xl flex items-center gap-3">
                    <Video className="h-8 w-8" />
                    Spark Rooms
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Join virtual rooms and connect with the community
                  </p>
                </div>

                <Dialog open={createRoomDialogOpen} onOpenChange={setCreateRoomDialogOpen}>
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

              {/* Room Search */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search rooms..."
                    value={roomSearchQuery}
                    onChange={(e) => setRoomSearchQuery(e.target.value)}
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
                              onClick={() => setSelectedRoom({ id: room.id, name: room.name })}
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
                    {roomSearchQuery ? 'No rooms found' : 'No Spark Rooms yet. Create the first one!'}
                  </p>
                </div>
              )}
        </Tabs>
        </div>
      </main>

      {/* Profile Editor Dialog */}
      {profile && (
        <ProfileEditor 
          open={profileEditorOpen} 
          onOpenChange={setProfileEditorOpen} 
          profile={profile} 
          onProfileUpdate={fetchUserProfile} 
        />
      )}

      {/* Spark Room Chat Dialog */}
      {selectedRoom && (
        <Dialog open={!!selectedRoom} onOpenChange={() => setSelectedRoom(null)}>
          <DialogContent className="max-w-2xl h-[700px] p-0">
            <SparkRoomChat
              roomId={selectedRoom.id}
              roomName={selectedRoom.name}
              onClose={() => setSelectedRoom(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
