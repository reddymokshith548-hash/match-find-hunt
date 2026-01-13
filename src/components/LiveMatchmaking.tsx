import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Heart, X, MapPin, Briefcase, Star, Sparkles, Eye, RefreshCw, Loader2, AlertCircle, Brain, BarChart3, Wand2 } from "lucide-react";

import { createConnectionRequest, recordPass } from "@/lib/connectionHelpers";
import { CompatibilityBreakdown } from "@/components/CompatibilityBreakdown";
import MutualNDAModal from "@/components/MutualNDAModal";

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
  thinking_style: string;
  leadership_style: string;
  risk_tolerance: string;
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
}

interface LiveMatchmakingProps {
  className?: string;
}

const LiveMatchmaking = ({ className = "" }: LiveMatchmakingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [useIntelligenceEngine, setUseIntelligenceEngine] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchProfile | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [generatingSummaryFor, setGeneratingSummaryFor] = useState<string | null>(null);
  
  // NDA Modal state
  const [ndaModalOpen, setNdaModalOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<{
    connectionId: string;
    targetProfileId: string;
    targetName: string;
  } | null>(null);
  
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

      // Check if user has completed FounderSync
      const { data: fsData } = await supabase
        .from("foundersync_results")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      setUseIntelligenceEngine(!!fsData);
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

        if (!engineError && engineResult?.matches) {
          const mapped: MatchProfile[] = engineResult.matches.map((m: any) => ({
            id: m.id,
            name: m.name,
            type: m.role || "User",
            interests: m.interests || [],
            skills: m.skills || [],
            match_score: m.final_score || 0,
            bio: m.bio,
            location: m.stage,
            profile_pic_url: m.profile_pic_url,
            role: m.role,
            ai_summary: m.ai_summary,
            phase: m.phase,
            viewer_traits: m.viewer_traits,
            candidate_traits: m.candidate_traits,
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
    if (user) {
      fetchMatches();
    }
  }, [user, useIntelligenceEngine]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) fetchMatches();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loading]);

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
      // Show NDA modal for sender to sign
      setPendingConnection({
        connectionId: result.connectionId,
        targetProfileId: targetProfile.id,
        targetName: targetProfile.name,
      });
      setNdaModalOpen(true);
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

  const handleNDAAccepted = () => {
    if (pendingConnection) {
      toast({
        title: "✅ Connection sent!",
        description: `We'll notify ${pendingConnection.targetName} about your request.`
      });
      removeMatch(pendingConnection.targetProfileId, "right");
      setPendingConnection(null);
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {useIntelligenceEngine ? (
                <>
                  <span className="gradient-text">FounderSync</span> Matches
                </>
              ) : (
                <>Live <span className="gradient-text">AI Matches</span></>
              )}
            </h2>
            <p className="text-muted-foreground">
              {useIntelligenceEngine 
                ? "Compatibility-scored matches based on your working style"
                : "Real-time AI-powered co-founder recommendations"
              }
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={loading} variant="outline" size="sm">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

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
                <Card variant="match" className="overflow-hidden group relative cursor-pointer transition-transform duration-300 ease-out hover:scale-[1.03] hover:shadow-2xl">
                  <div className="absolute top-4 right-4 z-10 flex gap-1">
                    {profile.phase === 'phase2' && profile.viewer_traits && profile.candidate_traits && (
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMatch(profile);
                          setShowBreakdown(true);
                        }}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Badge className={`font-semibold ${profile.phase === 'phase2' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                      {profile.match_score}% {profile.phase === 'phase2' ? 'Compatible' : 'Match'}
                    </Badge>
                  </div>
                  
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={profile.profile_pic_url || "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop"} 
                      alt={profile.name} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                    {profile.phase === 'phase2' && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
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
                        <h3 className="text-xl font-semibold mb-1">{profile.name}</h3>
                        <p className="text-muted-foreground text-sm mb-2">{profile.role || profile.type}</p>
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
                    {/* AI Summary Box - Show when available */}
                    {profile.ai_summary ? (
                      <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-foreground leading-relaxed">
                            {profile.ai_summary}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Bio when no AI summary */}
                        {profile.bio && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {profile.bio.length > 100 ? `${profile.bio.substring(0, 100)}...` : profile.bio}
                          </p>
                        )}
                        {/* Generate AI Summary button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          disabled={generatingSummaryFor === profile.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateAISummary(profile);
                          }}
                        >
                          {generatingSummaryFor === profile.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Wand2 className="w-4 h-4 mr-2" />
                          )}
                          Generate AI Summary
                        </Button>
                      </>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.slice(0, 3).map((skill, i) => (
                        <Badge 
                          key={i} 
                          className={getSkillColorClass(skill)}
                        >
                          {skill}
                        </Badge>
                      ))}
                      {profile.skills.length > 3 && (
                        <Badge variant="outline">+{profile.skills.length - 3}</Badge>
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
            ))}
          </div>
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

      {/* NDA Modal for sender */}
      {pendingConnection && (
        <MutualNDAModal
          open={ndaModalOpen}
          onOpenChange={(open) => {
            setNdaModalOpen(open);
            if (!open) setPendingConnection(null);
          }}
          targetUserName={pendingConnection.targetName}
          connectionId={pendingConnection.connectionId}
          isInitiator={true}
          onAccept={handleNDAAccepted}
        />
      )}
    </section>
  );
};

export default LiveMatchmaking;
