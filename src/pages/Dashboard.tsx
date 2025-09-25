import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Briefcase, 
  MessageSquare, 
  Calendar, 
  Settings, 
  LogOut,
  Search,
  Plus,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import LiveMatchmaking from '@/components/LiveMatchmaking';

interface Profile {
  id: string;
  name: string;
  bio: string;
  role: string;
  skills: string[];
  interests: string[];
  stage: string;
  looking_for: string[];
  profile_pic_url?: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  needs: string[];
  owner_id: string;
  profiles: {
    name: string;
    role: string;
    profile_pic_url?: string;
  };
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
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchMatches();
      fetchProjects();
      fetchOpportunities();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, redirect to onboarding
          navigate('/onboarding');
          return;
        }
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    }
  };

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_matchmaking_candidates', { 
          limit_count: 10,
          exclude_interacted: true 
        });

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          profiles(name, role, profile_pic_url)
        `)
        .limit(10);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('event_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (targetUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('connections')
        .insert([{
          user1_id: user.id,
          user2_id: targetUserId,
          status: 'pending'
        }]);

      if (error) throw error;

      toast({
        title: "Connection request sent!",
        description: "We'll notify you when they respond.",
      });
    } catch (error) {
      console.error('Error sending connection:', error);
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive",
      });
    }
  };

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
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold gradient-text">FindBaee</h1>
            <div className="hidden md:flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.profile_pic_url} />
                <AvatarFallback>{profile?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">Welcome, {profile?.name}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
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
        <Tabs defaultValue="matches" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit">
            <TabsTrigger value="matches" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Matches
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Projects
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

          {/* Live AI Matchmaking */}
          <TabsContent value="matches" className="space-y-6">
            <LiveMatchmaking />
          </TabsContent>

          {/* Projects */}
          <TabsContent value="projects" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Explore Projects</h2>
              <Button variant="hero">
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="hover-3d">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={project.profiles?.profile_pic_url} />
                        <AvatarFallback>{project.profiles?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          by {project.profiles?.name} • {project.profiles?.role}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{project.description}</p>
                    
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Looking for</h4>
                      <div className="flex flex-wrap gap-1">
                        {project.needs?.map((need) => (
                          <Badge key={need} variant="secondary" className="text-xs">
                            {need}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full" variant="outline">
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Messages */}
          <TabsContent value="messages" className="space-y-6">
            <h2 className="text-3xl font-bold">Messages</h2>
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                  <p className="text-muted-foreground">
                    Start connecting with people to begin conversations!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Opportunities */}
          <TabsContent value="opportunities" className="space-y-6">
            <h2 className="text-3xl font-bold">Opportunities Board</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {opportunities.map((opportunity) => (
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
                    
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => window.open(opportunity.link, '_blank')}
                    >
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
    </div>
  );
}