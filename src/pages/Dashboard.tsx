import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageSquare, Calendar, Settings, LogOut, ExternalLink, Zap, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import LiveMatchmaking from '@/components/LiveMatchmaking';
import SparkMatch from '@/components/SparkMatch';
import ProfileEditor from '@/components/ProfileEditor';
import NotificationCenter from '@/components/NotificationCenter';
import ConnectionRequests from '@/components/ConnectionRequests';
import FounderSyncBanner from '@/components/FounderSyncBanner';
import ErrorBoundary from '@/components/ErrorBoundary';

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

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [matches, setMatches] = useState<Profile[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [showFounderSyncBanner, setShowFounderSyncBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [activeTab, setActiveTab] = useState('spark');

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

  // Note: Connection handling is now managed by LiveMatchmaking component via unified helper

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
    <div className="min-h-screen bg-background">
      {/* FounderSync Banner */}
      {showFounderSyncBanner && !bannerDismissed && (
        <FounderSyncBanner onDismiss={handleDismissBanner} />
      )}

      {/* Header */}
      <header className="border-b bg-card shadow-sm">
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
            <NotificationCenter />
            <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
              <User className="h-4 w-4 mr-2" />
              My Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit">
            <TabsTrigger value="spark" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Spark Match
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Matches
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Opportunities
            </TabsTrigger>
          </TabsList>

          {/* Spark Match - Swipe Feature */}
          <TabsContent value="spark" className="space-y-6">
            <SparkMatch />
          </TabsContent>

          {/* Live AI Matchmaking */}
          <TabsContent value="matches" className="space-y-6">
            <ErrorBoundary title="Connection requests">
              <ConnectionRequests />
            </ErrorBoundary>
            <ErrorBoundary title="Matches">
              <LiveMatchmaking />
            </ErrorBoundary>
          </TabsContent>

          {/* Messages */}
          <TabsContent value="messages" className="space-y-6">
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Messages</h3>
              <p className="text-muted-foreground mb-4">
                View all your conversations in the Messages page
              </p>
              <Button onClick={() => navigate('/messages')} variant="hero">
                Go to Messages
              </Button>
            </div>
          </TabsContent>

          {/* Opportunities */}
          <TabsContent value="opportunities" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-3xl">Opportunities</h2>
              <Button onClick={() => navigate('/spark-rooms')} variant="outline">
                View All Spark Rooms
              </Button>
            </div>
            
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile Editor Dialog */}
      {profile && (
        <ProfileEditor 
          open={profileEditorOpen} 
          onOpenChange={setProfileEditorOpen} 
          profile={profile} 
          onProfileUpdate={fetchUserProfile} 
        />
      )}
    </div>
  );
}
