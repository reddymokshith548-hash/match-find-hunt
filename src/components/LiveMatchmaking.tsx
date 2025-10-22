import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Heart, X, MapPin, Briefcase, Star, Sparkles, Eye, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { ProfileHoverCard } from "@/components/ProfileHoverCard";

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
  
  // ✅ CORRECTION 1: Merge the duplicate API secret declarations.
  // We use the hardcoded secret found in utils.py for debugging.
  const [apiSecret, setApiSecret] = useState<string | null>("supersecret_api_token_for_frontend_to_call_ws");

  const wsRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // 🛑 CORRECTION 2: The entire broken useEffect (Step 0) has been removed.
  // The logic is now handled by the initial state declaration above.


  // 1️⃣ Fetch logged-in user's profile ID from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

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
      skills: ["React", "Python", "UI/UX", "Product Strategy"],
      match_score: 94,
      bio: "Passionate about building consumer apps. Looking for a business-minded co-founder.",
      location: "San Francisco, CA",
      experience: "5+ years",
      profile_pic_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
      role: "Full-Stack Developer & Product Designer",
    },
    {
      id: "2",
      name: "Marcus Johnson",
      type: "Business Partner",
      age: 32,
      interests: ["Fintech", "B2B SaaS", "Growth"],
      skills: ["Growth Marketing", "Sales", "Business Strategy", "Fundraising"],
      match_score: 89,
      bio: "Experienced in scaling B2B SaaS companies. Seeking a technical co-founder.",
      location: "New York, NY",
      experience: "8+ years",
      profile_pic_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
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

  // 4️⃣ WebSocket for live updates - UPDATED to use apiSecret state
  const setupWebSocket = () => {
    // Only proceed if both profileId and apiSecret are available
    if (!profileId || !apiSecret) {
        console.log("WebSocket setup deferred: Missing profileId or API secret.");
        return;
    }

    try {
      // NEW (Uses the fetched profileId, which is what your match endpoint expects)
// We already know profileId is non-null because of the parent useEffect check.
const WS_CLIENT_ID = profileId; // Use the fetched profileId for the path segment.
      
     // LiveMatchmaking.tsx

// 1. Host: Re-introduce the explicit port :8000 for direct connection to Uvicorn
// VERIFY THIS IP (192.168.29.199) is correct.
const BACKEND_WS_HOST = "192.168.29.199:8000"; 

// 2. Protocol: We keep the explicit 'ws' to avoid the HTTPS/WSS conflict
const scheme = "ws"; 



// ... inside the setupWebSocket function ...

if (!profileId || !apiSecret) {
    console.log("WebSocket setup deferred: Missing profileId or API secret.");
    return;
}

// 4. CRITICAL: The URL MUST include the api_secret as a query parameter
// NEW URL:
const wsUrl = `${scheme}://${BACKEND_WS_HOST}/ws/${WS_CLIENT_ID}?api_secret=${apiSecret}`;

console.log(`[WS] Final connection URL (Direct Uvicorn): ${wsUrl}`);
// ... rest of the function ...
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        // Use the fetched apiSecret for authentication
        ws.send(JSON.stringify({ type: "auth", token: apiSecret }));
        ws.send(JSON.stringify({ type: "subscribe", profile_id: profileId }));
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
    // Fetch initial matches once profileId is known
    if (profileId) {
      fetchMatches();
    }
    
    // Set up WebSocket once both profileId and apiSecret are ready
    if (profileId && apiSecret) {
        setupWebSocket();
    }

    // Cleanup function
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [profileId, apiSecret]); // Trigger on changes to profileId OR apiSecret

  // 6️⃣ Auto-refresh every 5 minutes (remains the same)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) fetchMatches();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loading]);

  // 7️⃣ Handle actions (remains the same)
  const handleConnect = (id: string) => {
    toast({ title: "Connection sent!", description: "We'll notify you when they respond." });
    removeMatch(id, "right");
  };

  const handlePass = (id: string) => removeMatch(id, "left");

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

  // 8️⃣ Render UI (remains the same)
  return (
    <section className={`py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
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

        {/* The error message you were seeing is now driven by the actual error state */}
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
                    {/* Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-primary text-primary-foreground font-semibold animate-pulse">
                        {profile.match_score}% Match
                      </Badge>
                    </div>
                    {/* Profile Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img src={profile.profile_pic_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face"} alt={profile.name} className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105" />
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
                        {profile.skills.slice(0, 3).map((skill, i) => <Badge key={i} variant="secondary" className="text-xs hover:bg-primary hover:text-primary-foreground transition-all duration-300">{skill}</Badge>)}
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
