import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Heart, X, MapPin, Briefcase, Star, Sparkles, Eye, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { ProfileHoverCard } from "@/components/ProfileHoverCard";
import { createConnectionRequest, recordPass } from "@/lib/connectionHelpers";

// 1. 🎨 New Skill Color Utility Function
const getSkillColorClass = (skill: string) => {
  const lowerSkill = skill.toLowerCase();
  
  // Tech/Coding (Green)
  if (lowerSkill.includes('react') || lowerSkill.includes('python') || lowerSkill.includes('javascript') || lowerSkill.includes('code') || lowerSkill.includes('software')) {
    return 'bg-green-600 hover:bg-green-700 text-white';
  }
  // Marketing/Sales (Blue)
  if (lowerSkill.includes('marketing') || lowerSkill.includes('sales') || lowerSkill.includes('growth')) {
    return 'bg-blue-600 hover:bg-blue-700 text-white';
  }
  // Product/Strategy (Indigo)
  if (lowerSkill.includes('product') || lowerSkill.includes('strategy') || lowerSkill.includes('business')) {
    return 'bg-indigo-600 hover:bg-indigo-700 text-white';
  }
  // Design (Pink)
  if (lowerSkill.includes('design') || lowerSkill.includes('ui/ux') || lowerSkill.includes('figma')) {
    return 'bg-pink-600 hover:bg-pink-700 text-white';
  }
  // DevOps/Cloud (Yellow/Amber)
  if (lowerSkill.includes('devops') || lowerSkill.includes('cloud') || lowerSkill.includes('aws') || lowerSkill.includes('azure')) {
    return 'bg-amber-600 hover:bg-amber-700 text-white';
  }
  // Finance/Fundraising (Purple)
  if (lowerSkill.includes('finance') || lowerSkill.includes('investor') || lowerSkill.includes('fundraising')) {
    return 'bg-purple-600 hover:bg-purple-700 text-white';
  }
  
  // Default
  return 'bg-gray-500 hover:bg-gray-600 text-white'; 
};

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  
  const [apiSecret, setApiSecret] = useState<string | null>("supersecret_api_token_for_frontend_to_call_ws");

  const wsRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // 1️⃣ Fetch logged-in user's profile ID from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch profile:", error);
        return;
      }

      setProfileId(data?.id || null);
    };

    fetchProfile();
  }, [user]);

  // Mock data function (remains the same)
  const getMockMatches = (): MatchProfile[] => [
    {
      id: "1",
      name: "Sarah Chen",
      type: "Co-Founder",
      age: 28,
      interests: ["AI", "Healthcare", "Sustainability"],
      // 💡 Added more diverse skills for testing color-coding
      skills: ["React", "Python", "UI/UX", "Product Strategy", "Fundraising"], 
      match_score: 94,
      bio: "Passionate about building consumer apps. Looking for a business-minded co-founder.",
      location: "San Francisco, CA",
      experience: "5+ years",
      profile_pic_url: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
      role: "Full-Stack Developer & Product Designer",
    },
    {
      id: "2",
      name: "Marcus Johnson",
      type: "Business Partner",
      age: 32,
      interests: ["Fintech", "B2B SaaS", "Growth"],
      // 💡 Added more diverse skills for testing color-coding
      skills: ["Growth Marketing", "Sales", "Business Strategy", "DevOps"],
      match_score: 89,
      bio: "Experienced in scaling B2B SaaS companies. Seeking a technical co-founder.",
      location: "New York, NY",
      experience: "8+ years",
      profile_pic_url: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
      role: "Business Development & Marketing Expert",
    },
  ];

  // 2️⃣ Fetch matches from backend (Supabase RPC or fallback)
  const fetchMatches = async () => {
    if (!profileId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc("get_matchmaking_candidates", {
        limit_count: 10,
        exclude_interacted: true,
      });

      if (error) throw error;

      const mapped: MatchProfile[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        type: p.role || "User",
        age: p.age,
        interests: p.interests || [],
        skills: p.skills || [],
        match_score: p.match_score || 0,
        bio: p.bio,
        location: p.location,
        experience: p.experience,
        profile_pic_url: p.profile_pic_url,
        role: p.role,
      }));

      setMatches(mapped);
      animateNewMatches(mapped);
    } catch (err) {
      console.error("Error fetching matches:", err);
      setError("Failed to fetch matches. Showing sample matches.");
      const sample = getMockMatches();
      setMatches(sample);
      animateNewMatches(sample);
    } finally {
      setLoading(false);
    }
  };

  // 3️⃣ Animate new matches (remains the same)
  const animateNewMatches = (newMatches: MatchProfile[]) => {
    newMatches.forEach((match, index) => {
      setTimeout(() => {
        const el = cardRefs.current[match.id];
        if (el) {
          el.style.opacity = "0";
          el.style.transform = "translateY(20px) scale(0.95)";
          el.style.transition = "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
          setTimeout(() => {
            el.style.opacity = "1";
            el.style.transform = "translateY(0) scale(1)";
          }, 100);
        }
      }, index * 150);
    });
  };

  // 4️⃣ WebSocket for live updates - UPDATED
  const setupWebSocket = () => {
    if (!profileId || !apiSecret) {
      console.log("WebSocket setup deferred: Missing profileId or API secret.");
      return;
    }

    try {
      const WS_CLIENT_ID = profileId;
      const BACKEND_WS_HOST = "10.184.10.84:8000"; 
      const scheme = "ws"; 

      const wsUrl = `${scheme}://${BACKEND_WS_HOST}/ws/${WS_CLIENT_ID}?api_secret=${apiSecret}`;

      console.log(`[WS] Final connection URL (Direct Uvicorn): ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        ws.send(JSON.stringify({ type: "auth", token: apiSecret }));
        setTimeout(() => {
          ws.send(JSON.stringify({ type: "subscribe", profile_id: profileId }));
        }, 100);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "matches") {
            setMatches(data.matches);
            animateNewMatches(data.matches);
          }
        } catch (err) {
          console.error("WebSocket invalid message:", event.data);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected, retrying in 5s...");
        retryTimeoutRef.current = setTimeout(setupWebSocket, 5000);
      };

      ws.onerror = (err) => console.error("WebSocket error:", err);
    } catch (err) {
      console.error("Failed to setup WebSocket:", err);
    }
  };

  // 5️⃣ Component init - UPDATED dependency array
  useEffect(() => {
    if (profileId) {
      fetchMatches();
    }
    
    if (profileId && apiSecret) {
        setupWebSocket();
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [profileId, apiSecret]);

  // 6️⃣ Auto-refresh every 5 minutes (remains the same)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) fetchMatches();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loading]);

  // 7️⃣ Handle actions (remains the same)
  const handleConnect = async (targetProfileId: string) => {
    if (!profileId || !user) {
      toast({
        title: "Error",
        description: "Please log in to send connection requests",
        variant: "destructive"
      });
      return;
    }

    const result = await createConnectionRequest(profileId, targetProfileId);

    if (result.success) {
      toast({
        title: "Connection sent!",
        description: "We'll notify you when they respond."
      });
      removeMatch(targetProfileId, "right");
    } else if (result.alreadyExists) {
      toast({
        title: "Already connected",
        description: "You've already sent a connection request to this person",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to send connection request",
        variant: "destructive"
      });
    }
  };

  const handlePass = async (targetProfileId: string) => {
    if (user) {
      await recordPass(user.id, targetProfileId);
    }
    removeMatch(targetProfileId, "left");
  };

  const removeMatch = (id: string, direction: "left" | "right") => {
    const el = cardRefs.current[id];
    if (el) {
      el.style.transform = direction === "right" ? "scale(0.8) translateX(100px)" : "scale(0.8) translateX(-100px)";
      el.style.opacity = "0";
      setTimeout(() => setMatches((prev) => prev.filter((m) => m.id !== id)), 300);
    }
  };

  const handleViewProfile = (id: string) => {
    window.location.href = `/profile/${id}`;
  };

  const handleRefresh = () => fetchMatches();

  // 8️⃣ Render UI - UPDATED SKILL BADGES
  return (
    <section className={`py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header (omitted for brevity, remains the same) */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Live <span className="gradient-text">AI Matches</span></h2>
            <p className="text-muted-foreground">Real-time AI-powered co-founder recommendations</p>
          </div>
          <Button onClick={handleRefresh} disabled={loading} variant="outline" size="sm">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
        </div>

        {/* Error/Loading/Empty States (omitted for brevity, remains the same) */}
        {error && <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </div>}

        {loading && matches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
            <p className="text-muted-foreground">Finding your perfect matches...</p>
          </div>
        )}

        {!loading && matches.length === 0 && !error && (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No matches found</h3>
            <p className="text-muted-foreground mb-4">Complete your profile to get better AI recommendations</p>
            <Button onClick={handleRefresh} variant="hero">Try Again</Button>
          </div>
        )}

        {matches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((profile, index) => (
              <div key={profile.id} ref={el => (cardRefs.current[profile.id] = el)} className="relative" style={{ animationDelay: `${index * 0.1}s` }}>
                <ProfileHoverCard profile={profile} side="top">
                  <Card variant="match" className="overflow-hidden group relative transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-2 hover:shadow-xl">
                    {/* ... Image and Header content remains the same ... */}
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-primary text-primary-foreground font-semibold animate-pulse">
                        {profile.match_score}% Match
                      </Badge>
                    </div>
                    <div className="relative h-48 overflow-hidden">
                      <img src={profile.profile_pic_url || "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop"} alt={profile.name} className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
                      <Sparkles className="absolute top-2 left-2 w-4 h-4 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-2 right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-1 group-hover:gradient-text transition-all duration-300">{profile.name}</h3>
                          <p className="text-muted-foreground text-sm mb-2">{profile.role || profile.type}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {profile.location && <div className="flex items-center gap-1"><MapPin className="w-4 h-4" />{profile.location}</div>}
                            {profile.experience && <div className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{profile.experience}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-secondary">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-medium">4.9</span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-4">
                      {profile.bio && <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">{profile.bio.length > 120 ? `${profile.bio.substring(0, 120)}...` : profile.bio}</p>}
                      <div className="flex flex-wrap gap-2">
                        {/* 💡 UPDATED: Apply color class using getSkillColorClass */}
                        {profile.skills.slice(0, 3).map((skill, i) => (
                          <Badge 
                            key={i} 
                            // Use the color class helper here
                            className={`text-xs ${getSkillColorClass(skill)} transition-all duration-300 border-none`} 
                          >
                            {skill}
                          </Badge>
                        ))}
                        {profile.skills.length > 3 && <Badge variant="outline" className="text-xs">+{profile.skills.length - 3}</Badge>}
                      </div>
                    </CardContent>

                    <div className="p-4 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 hover:border-destructive hover:text-destructive transition-all duration-300" onClick={() => handlePass(profile.id)}><X className="w-4 h-4 mr-2" />Pass</Button>
                      <Button variant="outline" size="sm" onClick={() => handleViewProfile(profile.id)}><Eye className="w-4 h-4" /></Button>
                      <Button variant="hero" size="sm" className="flex-1" onClick={() => handleConnect(profile.id)}><Heart className="w-4 h-4 mr-2" />Connect</Button>
                    </div>
                  </Card>
                </ProfileHoverCard>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default LiveMatchmaking;
