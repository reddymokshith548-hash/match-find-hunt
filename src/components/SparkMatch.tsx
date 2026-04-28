import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, X, RotateCcw, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import SwipeCard from './SwipeCard';
import MutualNDAModal from './MutualNDAModal';
import { createConnectionRequest, recordPass } from '@/lib/connectionHelpers';
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
export default function SparkMatch() {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [ndaModalOpen, setNdaModalOpen] = useState(false);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [pendingConnection, setPendingConnection] = useState<{
    targetProfileId: string;
    targetName: string;
    connectionId: string;
  } | null>(null);
  useEffect(() => {
    if (user) {
      fetchMyProfile();
    }
  }, [user]);
  useEffect(() => {
    if (myProfileId) {
      fetchProfiles();
    }
  }, [myProfileId]);
  const fetchMyProfile = async () => {
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
    if (!error && data) {
      setMyProfileId(data.id);
    }
  };
  const fetchProfiles = async () => {
    if (!user || !myProfileId) return;
    setLoading(true);
    const normalizeProfile = (p: any): Profile | null => {
      if (!p || !p.id) return null;
      return {
        id: String(p.id),
        name: p.name || 'Unknown',
        bio: p.bio || '',
        role: p.role || '',
        skills: Array.isArray(p.skills) ? p.skills : [],
        interests: Array.isArray(p.interests) ? p.interests : [],
        location: p.location || '',
        age: typeof p.age === 'number' ? p.age : 0,
        match_score: typeof p.match_score === 'number' ? p.match_score : 80 + Math.floor(Math.random() * 20),
        stage: p.stage || '',
        looking_for: Array.isArray(p.looking_for) ? p.looking_for : [],
        profile_pic_url: p.profile_pic_url || undefined
      };
    };
    try {
      const {
        data,
        error
      } = await supabase.rpc('get_matchmaking_candidates', {
        limit_count: 20,
        exclude_interacted: true
      });
      if (error) throw error;
      const mapped = Array.isArray(data) ? data.map(normalizeProfile).filter(Boolean) as Profile[] : [];
      setProfiles(mapped);
    } catch (error: any) {
      console.error('Error fetching profiles (RPC):', error);

      // Fallback: fetch directly from profiles table (prevents the whole UI from breaking)
      const {
        data: fallbackRows,
        error: fallbackError
      } = await supabase.from('profiles').select('id, name, bio, role, skills, interests, location, age, stage, looking_for, profile_pic_url').eq('is_active', true).neq('id', myProfileId).limit(20);
      if (fallbackError) {
        console.error('Error fetching profiles (fallback):', fallbackError);
        toast({
          title: 'Error',
          description: fallbackError.message || 'Failed to load profiles',
          variant: 'destructive'
        });
        setProfiles([]);
      } else {
        const mapped = Array.isArray(fallbackRows) ? fallbackRows.map(p => normalizeProfile({
          ...p,
          match_score: 80 + Math.floor(Math.random() * 20)
        })).filter(Boolean) as Profile[] : [];
        setProfiles(mapped);
      }
    } finally {
      setLoading(false);
    }
  };
  const loadNextProfile = () => {
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setIsAnimating(false);
    }, 100);
  };
  const handleSwipeLeft = async () => {
    if (isAnimating || currentIndex >= profiles.length || !myProfileId) return;
    setIsAnimating(true);
    const profile = profiles[currentIndex];

    // RPC also enforces the daily 10/free swipe cap server-side.
    await recordPass(myProfileId, profile.id);
    setTimeout(() => {
      loadNextProfile();
    }, 300);
  };
  const handleSwipeRight = async () => {
    if (isAnimating || currentIndex >= profiles.length || !myProfileId) return;
    setIsAnimating(true);
    const profile = profiles[currentIndex];

    // Use the unified connection helper with PROFILE IDs
    const result = await createConnectionRequest(myProfileId, profile.id);
    if (result.success && result.connectionId) {
      // Show NDA modal for sender to sign
      setPendingConnection({
        targetProfileId: profile.id,
        targetName: profile.name,
        connectionId: result.connectionId
      });
      setNdaModalOpen(true);
      // Don't load next profile yet - wait for NDA acceptance
      setIsAnimating(false);
      return;
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
    setTimeout(() => {
      loadNextProfile();
    }, 300);
  };
  const handleNDAAccepted = () => {
    if (pendingConnection) {
      toast({
        title: "✅ Connection sent!",
        description: `We'll notify ${pendingConnection.targetName} about your request.`
      });
      setPendingConnection(null);
      loadNextProfile();
    }
  };
  const handleButtonPass = () => {
    const cardElement = document.querySelector('.swipe-card-container');
    if (cardElement) {
      (cardElement as HTMLElement).style.transform = 'translateX(-1000px) rotate(-30deg)';
      setTimeout(handleSwipeLeft, 300);
    }
  };
  const handleButtonLike = () => {
    const cardElement = document.querySelector('.swipe-card-container');
    if (cardElement) {
      (cardElement as HTMLElement).style.transform = 'translateX(1000px) rotate(30deg)';
      setTimeout(handleSwipeRight, 300);
    }
  };
  const handleReset = () => {
    setCurrentIndex(0);
    fetchProfiles();
  };
  if (loading) {
    return <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Finding your perfect matches...</p>
        </div>
      </div>;
  }
  if (profiles.length === 0 || currentIndex >= profiles.length) {
    return <div className="flex flex-col items-center justify-center h-[600px] text-center px-4">
        <Zap className="w-20 h-20 text-primary mb-4" />
        <h3 className="text-2xl font-bold mb-2">No more profiles!</h3>
        <p className="text-muted-foreground mb-6">
          You've seen all available matches. Check back later for more!
        </p>
        <Button onClick={handleReset} variant="hero">
          <RotateCcw className="w-4 h-4 mr-2" />
          Start Over
        </Button>
      </div>;
  }
  const currentProfile = profiles[currentIndex];
  return <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold gradient-text flex items-center gap-2">
            <Zap className="w-8 h-8" />
            Spark Match
          </h2>
          <p className="text-muted-foreground mt-1">
            Swipe right to connect • Swipe left to pass
          </p>
        </div>
        
      </div>

      {/* Card Stack */}
      <div className="relative h-[600px] mb-6">
        {/* Next card preview */}
        {currentIndex + 1 < profiles.length && <div className="absolute inset-0 scale-95 opacity-50">
            <div className="w-full h-full bg-card rounded-lg border-2 shadow-xl" />
          </div>}

        {/* Current card */}
        {currentProfile && <div className="absolute inset-0 swipe-card-container" key={currentProfile.id}>
            <SwipeCard profile={currentProfile} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight} />
          </div>}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center items-center gap-6">
        <Button size="lg" variant="outline" className="w-16 h-16 rounded-full border-2 border-red-500 hover:bg-red-500/10 hover:scale-110 transition-all" onClick={handleButtonPass} disabled={isAnimating}>
          <X className="w-8 h-8 text-red-500" />
        </Button>

        <Button size="lg" variant="outline" className="w-20 h-20 rounded-full border-2 border-green-500 hover:bg-green-500/10 hover:scale-110 transition-all shadow-lg" onClick={handleButtonLike} disabled={isAnimating}>
          <Heart className="w-10 h-10 text-green-500 fill-green-500" />
        </Button>
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>Drag the card or use the buttons below</p>
      </div>

      {/* NDA Modal */}
      {pendingConnection && <MutualNDAModal open={ndaModalOpen} onOpenChange={open => {
      setNdaModalOpen(open);
      if (!open) {
        // User closed modal without accepting - load next profile
        setPendingConnection(null);
        loadNextProfile();
      }
    }} targetUserName={pendingConnection.targetName} connectionId={pendingConnection.connectionId} isInitiator={true} onAccept={handleNDAAccepted} />}
    </div>;
}