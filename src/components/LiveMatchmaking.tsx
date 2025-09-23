import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Heart, 
  MapPin, 
  Briefcase, 
  Star, 
  Sparkles, 
  RefreshCw,
  Eye,
  Zap,
  Users,
  AlertCircle
} from 'lucide-react';

interface MatchProfile {
  id: string;
  name: string;
  type: string;
  age?: number;
  location?: string;
  interests: string[];
  skills: string[];
  bio?: string;
  profile_pic_url?: string;
  match_score: number;
  role?: string;
  stage?: string;
}

interface UserProfile {
  id: string;
  name: string;
  bio?: string;
  role?: string;
  skills: string[];
  interests: string[];
  stage?: string;
  looking_for: string[];
}

const LiveMatchmaking: React.FC = () => {
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [newMatchIds, setNewMatchIds] = useState<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, [user]);

  // Fetch AI matches from backend
  const fetchMatches = useCallback(async (showLoading = true) => {
    if (!userProfile) return;

    if (showLoading) setLoading(true);
    setError(null);

    try {
      // Simulate API call to /api/match endpoint
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || ''}`,
        },
        body: JSON.stringify({
          user_profile: userProfile,
          preferences: {
            max_matches: 10,
            min_score: 70
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Check for new matches to animate
      const currentMatchIds = new Set(matches.map(m => m.id));
      const newIds = new Set(
        data.matches
          .filter((match: MatchProfile) => !currentMatchIds.has(match.id))
          .map((match: MatchProfile) => match.id)
      );
      
      setNewMatchIds(newIds);
      setMatches(data.matches || []);
      
      // Clear new match indicators after animation
      setTimeout(() => setNewMatchIds(new Set()), 2000);

    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Failed to load matches. Please try again.');
      
      // Fallback to mock data for demo purposes
      const mockMatches: MatchProfile[] = [
        {
          id: '1',
          name: 'Sarah Chen',
          type: 'Co-founder',
          age: 28,
          location: 'San Francisco, CA',
          interests: ['AI', 'Healthcare', 'Sustainability'],
          skills: ['React', 'Python', 'Product Strategy', 'UI/UX'],
          bio: 'Passionate about building consumer apps that solve real problems. Looking for a business-minded co-founder to launch a healthtech startup.',
          profile_pic_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
          match_score: 94,
          role: 'Full-Stack Developer',
          stage: 'Idea'
        },
        {
          id: '2',
          name: 'Marcus Johnson',
          type: 'Business Partner',
          age: 32,
          location: 'New York, NY',
          interests: ['Fintech', 'B2B SaaS', 'Growth Marketing'],
          skills: ['Sales', 'Business Development', 'Fundraising', 'Marketing'],
          bio: 'Experienced in scaling B2B SaaS companies. Seeking a technical co-founder to build the next generation of productivity tools.',
          profile_pic_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
          match_score: 89,
          role: 'Business Development',
          stage: 'Early Startup'
        },
        {
          id: '3',
          name: 'Elena Rodriguez',
          type: 'Technical Co-founder',
          age: 26,
          location: 'Austin, TX',
          interests: ['Web3', 'Blockchain', 'DeFi'],
          skills: ['Solidity', 'JavaScript', 'Smart Contracts', 'DApp Development'],
          bio: 'Blockchain developer with 4+ years experience. Looking to revolutionize traditional finance with innovative DeFi solutions.',
          profile_pic_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
          match_score: 87,
          role: 'Blockchain Developer',
          stage: 'Prototype'
        }
      ];
      setMatches(mockMatches);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [userProfile, user, matches]);

  // Initialize WebSocket connection for real-time updates
  const initializeWebSocket = useCallback(() => {
    if (!user) return;

    try {
      // Replace with your actual WebSocket endpoint
      const wsUrl = `wss://your-api-domain.com/ws/matches/${user.id}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected for live matches');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'new_matches') {
            const newIds = new Set(data.matches.map((m: MatchProfile) => m.id));
            setNewMatchIds(newIds);
            setMatches(data.matches);
            
            toast({
              title: "New matches found!",
              description: `${data.matches.length} new potential co-founders discovered.`,
            });
            
            setTimeout(() => setNewMatchIds(new Set()), 2000);
          } else if (data.type === 'profile_updated') {
            fetchMatches(false);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(initializeWebSocket, 5000);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }, [user, fetchMatches, toast]);

  // Handle profile view
  const handleViewProfile = (matchId: string) => {
    // Navigate to detailed profile page
    window.location.href = `/profile/${matchId}`;
  };

  // Handle connect action
  const handleConnect = async (matchId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('connections')
        .insert([{
          user1_id: user.id,
          user2_id: matchId,
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

  // Initialize component
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    if (userProfile) {
      fetchMatches();
      initializeWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [userProfile, fetchMatches, initializeWebSocket]);

  // Listen for profile changes
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('profile_changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        }, 
        () => {
          fetchUserProfile();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchUserProfile]);

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Please sign in to see your matches</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold gradient-text">AI-Powered Matches</h2>
          <p className="text-muted-foreground mt-2">
            Discover your perfect co-founders with intelligent matching
          </p>
        </div>
        <Button
          onClick={() => fetchMatches()}
          disabled={loading}
          variant="outline"
          className="hover-3d"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <div className="flex gap-2 mb-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-14" />
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Matches</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchMatches()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No Matches State */}
      {!loading && !error && matches.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Matches Found</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't find any matches at the moment. Try updating your profile or check back later.
            </p>
            <Button onClick={() => fetchMatches()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Search Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Matches Grid */}
      {!loading && matches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <div
              key={match.id}
              className="relative group perspective-container"
              onMouseEnter={() => setHoveredCard(match.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <Card 
                className={`
                  overflow-hidden transition-all duration-500 cursor-pointer
                  ${newMatchIds.has(match.id) ? 'animate-slide-up ring-2 ring-primary' : ''}
                  ${hoveredCard === match.id 
                    ? 'transform scale-105 rotate-1 shadow-2xl z-10' 
                    : 'hover:scale-102 hover:-translate-y-2'
                  }
                  interactive-card glass-card
                `}
                style={{
                  transformStyle: 'preserve-3d',
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {/* Match Score Badge */}
                <div className="absolute top-4 right-4 z-20">
                  <Badge 
                    className="bg-gradient-primary text-white font-semibold animate-pulse-glow"
                  >
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    {match.match_score}%
                  </Badge>
                </div>

                {/* New Match Indicator */}
                {newMatchIds.has(match.id) && (
                  <div className="absolute top-4 left-4 z-20">
                    <Badge className="bg-secondary text-secondary-foreground animate-bounce">
                      <Sparkles className="w-3 h-3 mr-1" />
                      New!
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                      <AvatarImage src={match.profile_pic_url} />
                      <AvatarFallback className="bg-gradient-primary text-white text-lg">
                        {match.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{match.name}</h3>
                      <p className="text-sm text-muted-foreground">{match.role || match.type}</p>
                      {match.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          {match.location}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Bio Preview */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {match.bio || 'No bio available'}
                  </p>

                  {/* Skills Preview */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {match.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {match.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{match.skills.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleViewProfile(match.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 hover-tilt"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Profile
                    </Button>
                    <Button
                      onClick={() => handleConnect(match.id)}
                      variant="hero"
                      size="sm"
                      className="flex-1 hover-3d"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  </div>
                </CardContent>

                {/* Liquid Glass Hover Overlay */}
                {hoveredCard === match.id && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-md border border-white/20 rounded-xl z-30 p-6 flex flex-col justify-center animate-in fade-in-0 zoom-in-95 duration-300">
                    <div className="space-y-4">
                      {/* Enhanced Profile Info */}
                      <div className="text-center">
                        <h4 className="text-xl font-bold text-white mb-2">{match.name}</h4>
                        <p className="text-white/80 text-sm">{match.role || match.type}</p>
                        {match.stage && (
                          <Badge className="mt-2 bg-white/20 text-white border-white/30">
                            <Briefcase className="w-3 h-3 mr-1" />
                            {match.stage}
                          </Badge>
                        )}
                      </div>

                      {/* Skills */}
                      <div>
                        <h5 className="text-white font-semibold mb-2 flex items-center">
                          <Zap className="w-4 h-4 mr-2" />
                          Skills
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {match.skills.map((skill) => (
                            <Badge 
                              key={skill} 
                              className="bg-white/20 text-white border-white/30 text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Interests */}
                      <div>
                        <h5 className="text-white font-semibold mb-2 flex items-center">
                          <Heart className="w-4 h-4 mr-2" />
                          Interests
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {match.interests.map((interest) => (
                            <Badge 
                              key={interest} 
                              className="bg-white/20 text-white border-white/30 text-xs"
                            >
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Bio */}
                      {match.bio && (
                        <div>
                          <h5 className="text-white font-semibold mb-2">About</h5>
                          <p className="text-white/90 text-sm leading-relaxed">
                            {match.bio}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Glowing border effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 opacity-50 blur-sm -z-10" />
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveMatchmaking;