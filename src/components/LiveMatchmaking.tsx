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
        variant:
