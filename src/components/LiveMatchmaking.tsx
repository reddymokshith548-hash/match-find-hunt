import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGoToPricing } from "@/hooks/useGoToPricing";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Heart, X, MapPin, Briefcase, Star, Sparkles, Eye, RefreshCw, Loader2, AlertCircle, Brain, BarChart3, Wand2, Wifi } from "lucide-react";

import { createConnectionRequest, recordPass } from "@/lib/connectionHelpers";
import { CompatibilityBreakdown } from "@/components/CompatibilityBreakdown";
// MutualNDAModal removed - NDA flow is handled in ConnectionRequests
import MatchFilters, { MatchFiltersState } from "@/components/MatchFilters";
import { useRealtimeMatches } from "@/hooks/useRealtimeMatches";
import { usePlan } from "@/hooks/usePlan";
import { Lock } from "lucide-react";
import { useDailySwipes } from "@/hooks/useDailySwipes";
import UpgradeCTA from "@/components/UpgradeCTA";
import MatchAISummary from "@/components/MatchAISummary";
import { LayoutGrid, List as ListIcon } from "lucide-react";
import useLongPress from "@/hooks/useLongPress";
import ProfilePeekDialog from "@/components/ProfilePeekDialog";
import { MatchesSkeleton, ListSkeleton } from "@/components/dashboard/TabSkeletons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const getSkillColorClass = (skill: string) => {
  const lowerSkill = skill.toLowerCase();
  
  if (lowerSkill.includes('react') || lowerSkill.includes('python') || lowerSkill.includes('javascript') || lowerSkill.includes('code') || lowerSkill.includes('software')) {
    return 'bg-green-600 hover:bg-green-700 text-white';
  }
  if (lowerSkill.includes('marketing') || lowerSkill.includes('sales') || lowerSkill.includes('growth')) {
    return 'bg-blue-600 hover:bg-blue-700 text-white';
  }
  if (lowerSkill.includes('product') || lowerSkill.includes('strategy') || lowerSkill.includes('business')) {
    return 'bg-indigo-600 hover:bg-indigo-700 text-white';
  }
  if (lowerSkill.includes('design') || lowerSkill.includes('ui/ux') || lowerSkill.includes('figma')) {
    return 'bg-pink-600 hover:bg-pink-700 text-white';
  }
  if (lowerSkill.includes('devops') || lowerSkill.includes('cloud') || lowerSkill.includes('aws') || lowerSkill.includes('azure')) {
    return 'bg-amber-600 hover:bg-amber-700 text-white';
  }
  if (lowerSkill.includes('finance') || lowerSkill.includes('investor') || lowerSkill.includes('fundraising')) {
    return 'bg-purple-600 hover:bg-purple-700 text-white';
  }
  
  return 'bg-gray-500 hover:bg-gray-600 text-white'; 
};

interface TraitData {
  thinking_style?: string;
  leadership_style?: string;
  risk_tolerance?: string;
  founder_archetype?: string;
  decision_style?: string;
  values_profile?: string;
}

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
  ai_summary?: string | null;
  phase?: string;
  viewer_traits?: TraitData | null;
  candidate_traits?: TraitData | null;
  partnership_type?: string | null;
  model_dominance?: string | null;
}

interface LiveMatchmakingProps {
  className?: string;
}

const LiveMatchmaking = ({ className = "" }: LiveMatchmakingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  // Default to loading=true so the skeleton renders immediately on mount,
  // before fetchMatches even gets a chance to flip it.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [viewerSkills, setViewerSkills] = useState<string[]>([]);
  const [viewerInterests, setViewerInterests] = useState<string[]>([]);
  const [useIntelligenceEngine, setUseIntelligenceEngine] = useState(false);
  // Gate the initial match fetch until we know which engine to use, so users
  // never see legacy RPC results flicker in before FounderSync results arrive.
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchProfile | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [generatingSummaryFor, setGeneratingSummaryFor] = useState<string | null>(null);
  const { isPaid } = usePlan();
  const { used, remaining, exhausted, refresh: refreshSwipes } = useDailySwipes();
  const goPricing = useGoToPricing();
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window === "undefined") return "grid";
    return (localStorage.getItem("lm_view_mode") as "grid" | "list") || "grid";
  });
  useEffect(() => {
    try { localStorage.setItem("lm_view_mode", viewMode); } catch {}
  }, [viewMode]);
  const [peekProfile, setPeekProfile] = useState<MatchProfile | null>(null);

  const requirePaid = (featureLabel: string) => {
    if (isPaid) return true;
    toast({
      title: `${featureLabel} is a paid feature`,
      description: "Upgrade to Starter or Pro to unlock it.",
    });
    goPricing();
    return false;
  };
  
  // Filters state
  const [filters, setFilters] = useState<MatchFiltersState>({
    minCompatibility: 0,
    phase: 'all',
    skills: [],
  });
  
  // NDA Modal no longer needed here - handled in Messages/ConnectionRequests
  
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Real-time match notifications
  const { isSubscribed } = useRealtimeMatches({
    minScoreForNotification: 75,
    onNewMatch: () => {
      // Refresh matches when a new high-compatibility match is found
      fetchMatches();
    }
  });

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      // Run profile + FounderSync detection in parallel so we don't block
      // the first match fetch waiting on two sequential round-trips.
      const [profileRes, fsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, skills, interests")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("foundersync_results")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (profileRes.error) {
        console.error("Failed to fetch profile:", profileRes.error);
        // Even on error, unblock the fetch so the user sees something.
        setProfileLoaded(true);
        return;
      }

      const data = profileRes.data;
      setProfileId(data?.id || null);
      setViewerSkills(Array.isArray(data?.skills) ? data!.skills : []);
      setViewerInterests(Array.isArray(data?.interests) ? data!.interests : []);
      setUseIntelligenceEngine(!!fsRes.data);
      setProfileLoaded(true);
    };

    fetchProfile();
  }, [user]);

  const getMockMatches = (): MatchProfile[] => [
    {
      id: "1",
      name: "Sarah Chen",
      type: "Co-Founder",
      age: 28,
      interests: ["AI", "Healthcare", "Sustainability"],
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
      skills: ["Growth Marketing", "Sales", "Business Strategy", "DevOps"],
      match_score: 89,
      bio: "Experienced in scaling B2B SaaS companies. Seeking a technical co-founder.",
      location: "New York, NY",
      experience: "8+ years",
      profile_pic_url: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
      role: "Business Development & Marketing Expert",
    },
  ];

  // Fetch matches using intelligence engine or fallback
  const fetchMatches = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Try intelligence engine first if user completed FounderSync
      if (useIntelligenceEngine) {
        console.log('Using FounderSync Intelligence Engine...');
        const { data: engineResult, error: engineError } = await supabase.functions.invoke('get-visible-matches', {
          body: { user_id: user.id, limit: 20 }
        });

      if (!engineError && engineResult?.success && Array.isArray(engineResult.matches)) {
          // Filter out null/undefined entries and entries without valid id
          const validMatches = engineResult.matches.filter(
            (m: any) => m != null && typeof m === 'object' && m.id
          );
          
          const mapped: MatchProfile[] = validMatches.map((m: any) => ({
            id: m.id,
            name: m.name || 'Unknown',
            type: m.role || "User",
            interests: Array.isArray(m.interests) ? m.interests : [],
            skills: Array.isArray(m.skills) ? m.skills : [],
            match_score: typeof m.final_score === 'number' ? m.final_score : 0,
            bio: m.bio || undefined,
            location: m.stage || undefined,
            profile_pic_url: m.profile_pic_url || undefined,
            role: m.role || undefined,
            ai_summary: m.ai_summary || null,
            phase: m.phase || 'phase1',
            viewer_traits: m.viewer_traits || null,
            candidate_traits: m.candidate_traits || null,
            partnership_type: m.partnership_type || null,
            model_dominance: m.model_dominance || null,
          }));

          setMatches(mapped);
          animateNewMatches(mapped);
          setLoading(false);
          return;
        }

        console.log('Intelligence engine fallback to RPC...', engineError);
      }

      // Fallback to regular RPC
      const { data, error } = await supabase.rpc("get_matchmaking_candidates", {
        limit_count: 10,
        exclude_interacted: true,
      });

      if (error) throw error;

      // Ensure data is an array and filter out invalid entries
      const validData = Array.isArray(data) 
        ? data.filter((p: any) => p != null && typeof p === 'object' && p.id)
        : [];

      const mapped: MatchProfile[] = validData.map((p: any) => ({
        id: p.id,
        name: p.name || 'Unknown',
        type: p.role || "User",
        age: typeof p.age === 'number' ? p.age : undefined,
        interests: Array.isArray(p.interests) ? p.interests : [],
        skills: Array.isArray(p.skills) ? p.skills : [],
        match_score: typeof p.match_score === 'number' ? p.match_score : 0,
        bio: p.bio || undefined,
        location: p.location || undefined,
        experience: p.experience || undefined,
        profile_pic_url: p.profile_pic_url || undefined,
        role: p.role || undefined,
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

  useEffect(() => {
    // Wait until we know whether to use FounderSync, otherwise we'd fetch
    // RPC matches first and replace them moments later when the flag flips.
    if (user && profileLoaded) {
      fetchMatches();
    }
  }, [user, profileLoaded, useIntelligenceEngine]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) fetchMatches();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loading]);

  // Apply filters to matches with null-safety
  const filteredMatches = useMemo(() => {
    // First ensure matches is a valid array
    if (!Array.isArray(matches)) return [];
    
    return matches
      // Filter out any null/undefined entries or entries without id
      .filter((match): match is MatchProfile => match != null && !!match.id)
      .filter(match => {
        // Filter by minimum compatibility
        const score = match.match_score ?? 0;
        if (filters.minCompatibility > 0 && score < filters.minCompatibility) {
          return false;
        }
        
        // Filter by phase
        if (filters.phase !== 'all' && match.phase !== filters.phase) {
          return false;
        }
        
        // Filter by skills
        if (filters.skills.length > 0) {
          const matchSkills = Array.isArray(match.skills) 
            ? match.skills.map(s => (s || '').toLowerCase())
            : [];
          const hasMatchingSkill = filters.skills.some(skill => 
            matchSkills.some(ms => ms.includes(skill.toLowerCase()))
          );
          if (!hasMatchingSkill) return false;
        }
        
        return true;
      });
  }, [matches, filters]);

  const handleConnect = async (targetProfile: MatchProfile) => {
    if (!profileId || !user) {
      toast({
        title: "Error",
        description: "Please log in to send connection requests",
        variant: "destructive"
      });
      return;
    }

    const result = await createConnectionRequest(profileId, targetProfile.id);

    if (result.success && result.connectionId) {
      // Instagram-like flow: Just send the request, no NDA yet
      toast({
        title: "✅ Request Sent!",
        description: `Connection request sent to ${targetProfile.name}. They'll be notified!`
      });
      removeMatch(targetProfile.id, "right");
      refreshSwipes();
    } else if (result.swipeLimitReached) {
      toast({
        title: "Daily swipe limit reached",
        description: "You've used all 10 swipes today. Upgrade to keep swiping.",
        variant: "destructive",
      });
      goPricing();
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

  // NDA modal removed from connect flow - only shows when trying to chat

  const handlePass = async (targetProfileId: string) => {
    if (!profileId) {
      removeMatch(targetProfileId, "left");
      return;
    }
    const result = await recordPass(profileId, targetProfileId);
    if (result.swipeLimitReached) {
      toast({
        title: "Daily swipe limit reached",
        description: "You've used all 10 swipes today. Upgrade to keep swiping.",
        variant: "destructive",
      });
      goPricing();
      refreshSwipes();
      return;
    }
    removeMatch(targetProfileId, "left");
    refreshSwipes();
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
    navigate(`/profile/${id}`);
  };

  const handleGenerateAISummary = async (profile: MatchProfile) => {
    if (!user) return;
    
    setGeneratingSummaryFor(profile.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-summary', {
        body: {
          viewer_user_id: user.id,
          candidate_profile_id: profile.id
        }
      });

      if (error) throw error;

      if (data?.ai_summary) {
        // Update the match in state with the new AI summary
        setMatches(prev => prev.map(m => 
          m.id === profile.id 
            ? { ...m, ai_summary: data.ai_summary }
            : m
        ));
        
        toast({
          title: data.cached ? "📋 Cached Summary" : "✨ AI Summary Generated",
          description: data.cached ? "Retrieved from cache" : "Fresh compatibility analysis ready"
        });
      }
    } catch (err: any) {
      console.error('Error generating AI summary:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to generate AI summary",
        variant: "destructive"
      });
    } finally {
      setGeneratingSummaryFor(null);
    }
  };

  const handleRefresh = () => fetchMatches();

  return (
    <section className={`py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-3xl font-bold">
                {useIntelligenceEngine ? (
                  <>
                    <span className="gradient-text">FounderSync</span> Matches
                  </>
                ) : (
                  <>Live <span className="gradient-text">AI Matches</span></>
                )}
              </h2>
              {isSubscribed && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-green-500" />
                  Live
                </Badge>
              )}
              {!isPaid && (
                <Badge
                  variant={exhausted ? "destructive" : "outline"}
                  className="text-xs cursor-pointer"
                  onClick={() => exhausted && goPricing()}
                  title={exhausted ? "Upgrade to keep swiping" : "Daily swipes remaining"}
                >
                  {used} / 10 swipes today
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {useIntelligenceEngine 
                ? "Compatibility-scored matches based on your working style"
                : "Real-time AI-powered co-founder recommendations"
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <MatchFilters
              filters={filters}
              onFiltersChange={setFilters}
              isPaid={isPaid}
              availableSkills={[
                'React', 'Python', 'Marketing', 'Sales', 'Product', 'Design',
                'AI/ML', 'Growth', 'Finance', 'DevOps', 'Business Strategy', 'JavaScript'
              ]}
            />
            <Button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              variant="outline"
              size="sm"
              title={viewMode === "grid" ? "Switch to compact list" : "Switch to grid"}
            >
              {viewMode === "grid" ? <ListIcon className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
            </Button>
            <Button onClick={handleRefresh} disabled={loading} variant="outline" size="sm">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Refresh
            </Button>
          </div>
        </div>

        {!isPaid && (
          <div className="mb-6">
            <UpgradeCTA
              variant="banner"
              reason={
                exhausted
                  ? "You've used all your free swipes for today"
                  : "Unlock unlimited swipes, advanced filters & deep compatibility"
              }
              swipesRemaining={remaining as number}
              lockedFilters={4}
            />
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {/* Active Filters Summary */}
        {(filters.minCompatibility > 0 || filters.phase !== 'all' || filters.skills.length > 0) && (
          <div className="mb-6 p-3 bg-muted/50 rounded-lg flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Filtering:</span>
            {filters.minCompatibility > 0 && (
              <Badge variant="secondary">≥{filters.minCompatibility}%</Badge>
            )}
            {filters.phase !== 'all' && (
              <Badge variant="secondary">
                {filters.phase === 'phase2' ? 'FounderSync' : 'Profile-based'}
              </Badge>
            )}
            {filters.skills.map(skill => (
              <Badge key={skill} variant="secondary">{skill}</Badge>
            ))}
            <span className="text-muted-foreground ml-auto">
              {filteredMatches.length} of {matches.length} matches
            </span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {loading && matches.length === 0 && (
          viewMode === "grid" ? <MatchesSkeleton count={6} /> : <ListSkeleton count={6} />
        )}

        {!loading && filteredMatches.length === 0 && matches.length > 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No matches found with current filters</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your filter criteria</p>
            <Button onClick={() => setFilters({ minCompatibility: 0, phase: 'all', skills: [] })} variant="outline">
              Clear Filters
            </Button>
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

        {filteredMatches.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((profile, index) => {
              // Null safety checks for profile data
              if (!profile || !profile.id) return null;
              
              const profileName = profile.name || 'Unknown';
              const profileRole = profile.role || profile.type || 'User';
              const profileSkills = profile.skills || [];
              const profileInterests = profile.interests || [];
              const matchScore = profile.match_score || 0;
              
              return (
                <div key={profile.id} ref={el => (cardRefs.current[profile.id] = el)} className="relative" style={{ animationDelay: `${index * 0.1}s` }}>
                  <Card variant="match" className="overflow-hidden group relative cursor-pointer transition-transform duration-300 ease-out hover:scale-[1.03] hover:shadow-2xl">
                    <div className="absolute top-4 right-4 z-10 flex gap-1">
                      {profile.phase === 'phase2' && profile.viewer_traits && profile.candidate_traits && (
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!requirePaid("Deep compatibility breakdown")) return;
                            setSelectedMatch(profile);
                            setShowBreakdown(true);
                          }}
                        >
                          {isPaid ? <BarChart3 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </Button>
                      )}
                      <Badge className={`font-semibold ${profile.phase === 'phase2' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                        {matchScore}% {profile.phase === 'phase2' ? 'Compatible' : 'Match'}
                      </Badge>
                    </div>
                    
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={profile.profile_pic_url || "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop"} 
                        alt={profileName} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          // Fallback image on error
                          (e.target as HTMLImageElement).src = "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                      {profile.phase === 'phase2' && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="bg-background text-primary border border-primary/30 shadow-sm">
                            <Brain className="w-3 h-3 mr-1" />
                            FounderSync
                          </Badge>
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-1">{profileName}</h3>
                          <p className="text-muted-foreground text-sm mb-2">{profileRole}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {profile.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />{profile.location}
                              </div>
                            )}
                            {profile.experience && (
                              <div className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />{profile.experience}
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

                    <CardContent className="pt-0 space-y-4">
                      <MatchAISummary
                        matchId={profile.id}
                        matchName={profileName}
                        matchScore={matchScore}
                        bio={profile.bio}
                        aiSummary={profile.ai_summary}
                        viewerSkills={viewerSkills}
                        candidateSkills={profileSkills}
                        viewerInterests={viewerInterests}
                        candidateInterests={profileInterests}
                        viewerTraits={profile.viewer_traits}
                        candidateTraits={profile.candidate_traits}
                        hasFounderSyncTraits={
                          profile.phase === "phase2" &&
                          !!profile.viewer_traits &&
                          !!profile.candidate_traits
                        }
                        generating={generatingSummaryFor === profile.id}
                        onGenerateSummary={() => handleGenerateAISummary(profile)}
                        onOpenDeepBreakdown={() => {
                          if (!requirePaid("Deep compatibility breakdown")) return;
                          setSelectedMatch(profile);
                          setShowBreakdown(true);
                        }}
                      />
                      
                      <div className="flex flex-wrap gap-2">
                        {profileSkills.slice(0, 3).map((skill, i) => (
                          <Badge 
                            key={i} 
                            className={getSkillColorClass(skill)}
                          >
                            {skill}
                          </Badge>
                        ))}
                        {profileSkills.length > 3 && (
                          <Badge variant="outline">+{profileSkills.length - 3}</Badge>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handlePass(profile.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
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
                          onClick={() => handleConnect(profile)}
                        >
                          <Heart className="w-4 h-4 mr-1" />
                          Connect
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        {filteredMatches.length > 0 && viewMode === "list" && (
          <CompactMatchList
            matches={filteredMatches}
            onOpenFull={handleViewProfile}
            onPeek={(p) => setPeekProfile(p)}
            onConnect={handleConnect}
            onPass={handlePass}
          />
        )}
      </div>

      {/* Compatibility Breakdown Modal */}
      {selectedMatch && (
        <CompatibilityBreakdown
          open={showBreakdown}
          onOpenChange={setShowBreakdown}
          matchScore={selectedMatch.match_score}
          aiSummary={selectedMatch.ai_summary || ''}
          viewerTraits={selectedMatch.viewer_traits || { thinking_style: '', leadership_style: '', risk_tolerance: '' }}
          candidateTraits={selectedMatch.candidate_traits || { thinking_style: '', leadership_style: '', risk_tolerance: '' }}
          matchName={selectedMatch.name}
        />
      )}

      <ProfilePeekDialog
        profile={peekProfile}
        open={!!peekProfile}
        onOpenChange={(v) => !v && setPeekProfile(null)}
        onOpenFull={(id) => { setPeekProfile(null); handleViewProfile(id); }}
        onConnect={(p) => { setPeekProfile(null); handleConnect(p as MatchProfile); }}
      />

      {/* NDA Modal removed - NDA is only required when trying to chat, not on connect */}
    </section>
  );
};

export default LiveMatchmaking;

/* -------------------------------------------------------------------------- */
/* Compact list view: smaller typography, denser rows, easier to scan on small */
/* screens. Click → full profile. Long-press → peek dialog.                    */
/* -------------------------------------------------------------------------- */
interface CompactListProps {
  matches: MatchProfile[];
  onOpenFull: (id: string) => void;
  onPeek: (p: MatchProfile) => void;
  onConnect: (p: MatchProfile) => void;
  onPass: (id: string) => void;
}

const CompactRow = ({
  profile,
  onOpenFull,
  onPeek,
  onConnect,
  onPass,
}: { profile: MatchProfile } & Omit<CompactListProps, "matches">) => {
  const { progress, pressing, ...handlers } = useLongPress({
    onLongPress: () => onPeek(profile),
    onClick: () => onOpenFull(profile.id),
    delay: 500,
    haptic: true,
  });

  const score = profile.match_score || 0;
  const skills = profile.skills || [];
  const showFill = pressing && progress > 0.05;

  return (
    <div
      {...handlers}
      className={`relative overflow-hidden select-none flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-accent/40 transition-all cursor-pointer ${
        pressing ? "scale-[0.985]" : ""
      }`}
      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
    >
      {/* Long-press fill: a soft primary wash that grows from left to right */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 bg-primary/15 pointer-events-none transition-opacity"
        style={{
          width: `${Math.round(progress * 100)}%`,
          opacity: showFill ? 1 : 0,
          transition: pressing ? "width 60ms linear" : "opacity 200ms ease",
        }}
      />
      {/* Top progress bar — clearer signal that "something is happening" */}
      <div
        aria-hidden
        className="absolute top-0 left-0 h-0.5 bg-primary pointer-events-none"
        style={{
          width: `${Math.round(progress * 100)}%`,
          opacity: showFill ? 1 : 0,
          transition: pressing ? "width 60ms linear" : "opacity 200ms ease",
        }}
      />

      <Avatar className="h-11 w-11 shrink-0">
        <AvatarImage src={profile.profile_pic_url} alt={profile.name} />
        <AvatarFallback className="text-xs">{(profile.name || "?").charAt(0)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 relative">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{profile.name || "Unknown"}</p>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
            {Math.round(score)}%
          </Badge>
          {profile.phase === "phase2" && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
              <Brain className="w-2.5 h-2.5 mr-0.5" /> FS
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">
          {profile.role || profile.type || "User"}
          {profile.location ? ` · ${profile.location}` : ""}
        </p>
        {skills.length > 0 && (
          <div className="flex gap-1 mt-1 overflow-hidden">
            {skills.slice(0, 3).map((s, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground truncate max-w-[80px]"
              >
                {s}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                +{skills.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onPass(profile.id)} title="Pass">
          <X className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="hero" className="h-8 w-8" onClick={() => onConnect(profile)} title="Connect">
          <Heart className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const CompactMatchList = ({ matches, onOpenFull, onPeek, onConnect, onPass }: CompactListProps) => (
  <div className="space-y-2">
    <p className="text-[11px] text-muted-foreground px-1">
      Tip: tap to open full profile · long-press for a quick peek
    </p>
    {matches.map((p) => (
      <CompactRow
        key={p.id}
        profile={p}
        onOpenFull={onOpenFull}
        onPeek={onPeek}
        onConnect={onConnect}
        onPass={onPass}
      />
    ))}
  </div>
);
