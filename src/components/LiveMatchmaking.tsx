import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  X, 
  MapPin, 
  Briefcase, 
  Star, 
  Sparkles, 
  Eye,
  RefreshCw,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface MatchProfile {
  id: string;
  name: string;
  type: string;
  age?: number;
  interests: string[];
  skills: string[];
  match_score: number;
  bio?: string;
  location?: string;
  experience?: string;
  profile_pic_url?: string;
  role?: string;
}

interface LiveMatchmakingProps {
  className?: string;
}

const LiveMatchmaking = ({ className = "" }: LiveMatchmakingProps) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredProfile, setHoveredProfile] = useState<string | null>(null);
  const [touchTimer, setTouchTimer] = useState<NodeJS.Timeout | null>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const wsRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle touch events for mobile
  const handleTouchStart = (profileId: string) => {
    const timer = setTimeout(() => {
      setHoveredProfile(profileId);
    }, 500); // 500ms long press
    setTouchTimer(timer);
  };

  const handleTouchEnd = () => {
    if (touchTimer) {
      clearTimeout(touchTimer);
      setTouchTimer(null);
    }
    setHoveredProfile(null);
  };

  const handleMouseEnter = (profileId: string) => {
    setHoveredProfile(profileId);
  };

  const handleMouseLeave = () => {
    setHoveredProfile(null);
  };

  // Fetch matches from API
  const fetchMatches = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Mock user profile data - in real app, fetch from user profile
      const userProfile = {
        id: user.id,
        user_id: user.id,
        name: user.user_metadata?.full_name || "User",
        bio: "Looking for co-founders",
        role: "Entrepreneur",
        skills: ["JavaScript", "Product Management", "Marketing"],
        interests: ["Technology", "Startups", "Innovation"],
        stage: "Idea",
        looking_for: ["Co-Founder", "Team Members"],
        profile_pic_url: user.user_metadata?.avatar_url || "",
        created_at: new Date().toISOString(),
        location: null,
        age: null,
        preferred_age_min: null,
        preferred_age_max: null,
        max_distance: 50,
        gender: null,
        preferred_gender: null,
        profile_completed: false,
        last_active: new Date().toISOString(),
        is_verified: false
      };

      const response = await fetch('/api/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          user_profile: userProfile,
          preferences: {
            max_matches: 10,
            min_score: 70
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.matches && Array.isArray(data.matches)) {
        setMatches(data.matches);
        animateNewMatches(data.matches);
      } else {
        // Fallback mock data for development
        setMatches(getMockMatches());
        animateNewMatches(getMockMatches());
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Failed to fetch matches. Showing sample matches.');
      setMatches(getMockMatches());
      animateNewMatches(getMockMatches());
    } finally {
      setLoading(false);
    }
  };

  // Get mock matches for development
  const getMockMatches = (): MatchProfile[] => [
    {
      id: "1",
      name: "Sarah Chen",
      type: "Co-Founder",
      age: 28,
      interests: ["AI", "Healthcare", "Sustainability"],
      skills: ["React", "Python", "UI/UX", "Product Strategy"],
      match_score: 94,
      bio: "Passionate about building consumer apps that solve real problems. Looking for a business-minded co-founder to launch a healthtech startup.",
      location: "San Francisco, CA",
      experience: "5+ years",
      profile_pic_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
      role: "Full-Stack Developer & Product Designer"
    },
    {
      id: "2",
      name: "Marcus Johnson",
      type: "Business Partner",
      age: 32,
      interests: ["Fintech", "B2B SaaS", "Growth"],
      skills: ["Growth Marketing", "Sales", "Business Strategy", "Fundraising"],
      match_score: 89,
      bio: "Experienced in scaling B2B SaaS companies. Seeking a technical co-founder to build the next generation of productivity tools.",
      location: "New York, NY",
      experience: "8+ years",
      profile_pic_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      role: "Business Development & Marketing Expert"
    },
    {
      id: "3",
      name: "Elena Rodriguez",
      type: "Technical Co-Founder",
      age: 26,
      interests: ["Web3", "DeFi", "Blockchain"],
      skills: ["Solidity", "React", "Node.js", "Smart Contracts"],
      match_score: 87,
      bio: "Blockchain developer with expertise in DeFi protocols. Looking to partner with someone who shares my vision for decentralized finance.",
      location: "Austin, TX",
      experience: "4+ years",
      profile_pic_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      role: "Blockchain Developer"
    }
  ];

  // Animate new matches appearing
  const animateNewMatches = (newMatches: MatchProfile[]) => {
    newMatches.forEach((match, index) => {
      setTimeout(() => {
        const element = cardRefs.current[match.id];
        if (element) {
          element.style.opacity = '0';
          element.style.transform = 'translateY(20px) scale(0.95)';
          element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
          
          setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0) scale(1)';
          }, 100);
        }
      }, index * 150);
    });
  };

  // WebSocket connection for real-time updates
  const setupWebSocket = () => {
    if (!user) return;

    try {
      // Replace with your actual Supabase project URL
      const wsUrl = `wss://vagrjonewjbjeuotsrya.supabase.co/realtime/v1/websocket?apikey=${encodeURIComponent("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhZ3Jqb25ld2piamV1b3RzcnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4ODA0MzgsImV4cCI6MjA3MjQ1NjQzOH0.I8yQhk7JSSol3EeVtMs2ZmVVj3Y1TndyLNUsjHf8H-0")}&vsn=1.0.0`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected for live matching');
        // Join profile updates channel
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            topic: "realtime:public:profiles",
            event: "phx_join",
            payload: {},
            ref: Date.now()
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'UPDATE' || data.event === 'INSERT') {
            // Refresh matches when profiles are updated
            fetchMatches();
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect...');
        // Retry connection after 5 seconds
        retryTimeoutRef.current = setTimeout(setupWebSocket, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
    }
  };

  // Handle actions
  const handleConnect = async (profileId: string) => {
    try {
      // Here you would typically send a connection request to your backend
      toast({
        title: "Connection sent!",
        description: "We'll notify you when they respond.",
      });
      
      // Remove the matched profile with animation
      const element = cardRefs.current[profileId];
      if (element) {
        element.style.transform = 'scale(0.8) translateX(100px)';
        element.style.opacity = '0';
        setTimeout(() => {
          setMatches(prev => prev.filter(m => m.id !== profileId));
        }, 300);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive",
      });
    }
  };

  const handlePass = async (profileId: string) => {
    // Remove the profile with animation
    const element = cardRefs.current[profileId];
    if (element) {
      element.style.transform = 'scale(0.8) translateX(-100px)';
      element.style.opacity = '0';
      setTimeout(() => {
        setMatches(prev => prev.filter(m => m.id !== profileId));
      }, 300);
    }
  };

  const handleViewProfile = (profileId: string) => {
    // Navigate to profile page - implement based on your routing
    window.location.href = `/profile/${profileId}`;
  };

  const handleRefresh = () => {
    fetchMatches();
  };

  // Initialize component
  useEffect(() => {
    fetchMatches();
    setupWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [user]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchMatches();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loading]);

  return (
    <section className={`py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Live <span className="gradient-text">AI Matches</span>
            </h2>
            <p className="text-muted-foreground">
              Real-time AI-powered co-founder recommendations
            </p>
          </div>
          
          <Button 
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && matches.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Finding your perfect matches...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && matches.length === 0 && !error && (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No matches found</h3>
            <p className="text-muted-foreground mb-4">
              Complete your profile to get better AI recommendations
            </p>
            <Button onClick={handleRefresh} variant="hero">
              Try Again
            </Button>
          </div>
        )}

        {/* Matches Grid */}
        {matches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((profile, index) => (
              <div
                key={profile.id}
                ref={el => cardRefs.current[profile.id] = el}
                className="relative"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Card 
                  variant="match"
                  className={`overflow-hidden group relative transition-all duration-500 cursor-pointer ${
                    hoveredProfile === profile.id 
                      ? 'scale-125 z-20 shadow-2xl transform' 
                      : 'hover:scale-105 hover:-translate-y-2'
                  }`}
                  onMouseEnter={() => handleMouseEnter(profile.id)}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={() => handleTouchStart(profile.id)}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Match Score Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-primary text-primary-foreground font-semibold animate-pulse">
                      {profile.match_score}% Match
                    </Badge>
                  </div>

                  {/* Profile Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={profile.profile_pic_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face"}
                      alt={profile.name}
                      className={`w-full h-full object-cover transition-all duration-700 ${
                        hoveredProfile === profile.id 
                          ? 'scale-125 brightness-110' 
                          : 'group-hover:scale-105'
                      }`}
                    />
                    
                    {/* Gradient overlay for better text readability */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent transition-opacity duration-300 ${
                      hoveredProfile === profile.id ? 'opacity-60' : 'opacity-0 group-hover:opacity-40'
                    }`} />
                    
                    {/* Enhanced info overlay on hover/long press - Additional details */}
                    {hoveredProfile === profile.id && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col justify-center items-center p-4 text-white animate-fade-in">
                        <div className="text-center space-y-3 max-w-full">
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 space-y-2">
                            <h4 className="font-semibold text-sm text-green-400">Additional Details</h4>
                            <div className="text-xs space-y-1">
                              <p><span className="font-medium">Age:</span> {profile.age || 'Not specified'}</p>
                              <p><span className="font-medium">Match Score:</span> {profile.match_score}% compatibility</p>
                              <p><span className="font-medium">Type:</span> {profile.type}</p>
                            </div>
                          </div>
                          
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 space-y-2">
                            <h4 className="font-semibold text-sm text-blue-400">All Interests</h4>
                            <div className="flex flex-wrap gap-1 justify-center">
                              {profile.interests.map((interest, idx) => (
                                <span key={idx} className="bg-blue-500/30 rounded-full px-2 py-1 text-xs">
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 space-y-2">
                            <h4 className="font-semibold text-sm text-purple-400">All Skills</h4>
                            <div className="flex flex-wrap gap-1 justify-center">
                              {profile.skills.map((skill, idx) => (
                                <span key={idx} className="bg-purple-500/30 rounded-full px-2 py-1 text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Floating elements - always visible */}
                    <Sparkles className="absolute top-2 left-2 w-4 h-4 text-white/60 opacity-0 group-hover:opacity-100 animate-float transition-opacity duration-300" />
                    <div className="absolute bottom-2 right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>

                  {/* Card Header - Always visible */}
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1 group-hover:gradient-text transition-all duration-300">
                          {profile.name}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-2">
                          {profile.role || profile.type}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {profile.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {profile.location}
                            </div>
                          )}
                          {profile.experience && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              {profile.experience}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-secondary">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-medium">4.9</span>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Card Content - Always visible */}
                  <CardContent className="pt-0 space-y-4">
                    {/* Bio */}
                    {profile.bio && (
                      <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">
                        {profile.bio.length > 120 ? `${profile.bio.substring(0, 120)}...` : profile.bio}
                      </p>
                    )}

                    {/* Skills Preview */}
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.slice(0, 3).map((skill, skillIndex) => (
                        <Badge 
                          key={skillIndex}
                          variant="secondary"
                          className="text-xs hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {profile.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{profile.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>

                  {/* Action Buttons - Always visible at bottom */}
                  <div className="p-4">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 hover:border-destructive hover:text-destructive transition-all duration-300"
                        onClick={() => handlePass(profile.id)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Pass
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewProfile(profile.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="hero" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleConnect(profile.id)}
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default LiveMatchmaking;