import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, X, RotateCcw, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import SwipeCard from './SwipeCard';
import NDAModal from './NDAModal';

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
}

export default function SparkMatch() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [ndaModalOpen, setNdaModalOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<{
    targetUserId: string;
    targetUserName: string;
    connectionId: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_matchmaking_candidates', {
        limit_count: 20,
        exclude_interacted: true
      });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Failed to load profiles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const recordInteraction = async (targetUserId: string, interactionType: 'like' | 'pass') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_interactions')
        .insert([{
          user_id: user.id,
          target_user_id: targetUserId,
          interaction_type: interactionType
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  };

  const loadNextProfile = () => {
    setCurrentIndex(prev => prev + 1);
    setIsAnimating(false);
  };

  const handleSwipeLeft = async () => {
    if (isAnimating || currentIndex >= profiles.length) return;
    
    setIsAnimating(true);
    const profile = profiles[currentIndex];
    
    await recordInteraction(profile.id, 'pass');
    
    setTimeout(() => {
      loadNextProfile();
    }, 300);
  };

  const handleSwipeRight = async () => {
    if (isAnimating || currentIndex >= profiles.length) return;
    
    setIsAnimating(true);
    const profile = profiles[currentIndex];
    
    await recordInteraction(profile.id, 'like');
    
    // Get profile user_id for connection
    const { data: profileData } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', profile.id)
      .single();
    
    if (profileData) {
      // Create connection
      const { data: connection, error } = await supabase
        .from('connections')
        .insert({
          user1_id: user?.id,
          user2_id: profileData.user_id,
          status: 'pending'
        })
        .select()
        .single();

      if (!error && connection) {
        // Open NDA modal
        setPendingConnection({
          targetUserId: profileData.user_id,
          targetUserName: profile.name,
          connectionId: connection.id
        });
        setNdaModalOpen(true);
      }
    }
    
    setTimeout(() => {
      loadNextProfile();
    }, 300);
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
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Finding your perfect matches...</p>
        </div>
      </div>
    );
  }

  if (profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center px-4">
        <Zap className="w-20 h-20 text-primary mb-4" />
        <h3 className="text-2xl font-bold mb-2">No more profiles!</h3>
        <p className="text-muted-foreground mb-6">
          You've seen all available matches. Check back later for more!
        </p>
        <Button onClick={handleReset} variant="hero">
          <RotateCcw className="w-4 h-4 mr-2" />
          Start Over
        </Button>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="w-full max-w-2xl mx-auto">
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
        <div className="text-sm font-medium px-4 py-2 rounded-full bg-primary/10">
          {currentIndex + 1} / {profiles.length}
        </div>
      </div>

      {/* Card Stack */}
      <div className="relative h-[600px] mb-6">
        {/* Next card preview */}
        {currentIndex + 1 < profiles.length && (
          <div className="absolute w-full h-full scale-95 opacity-50 blur-sm">
            <div className="w-full h-full bg-card rounded-lg border-2" />
          </div>
        )}

        {/* Current card */}
        <div className="swipe-card-container">
          <SwipeCard
            profile={currentProfile}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center items-center gap-6">
        <Button
          size="lg"
          variant="outline"
          className="w-16 h-16 rounded-full border-2 border-red-500 hover:bg-red-500/10 hover:scale-110 transition-all"
          onClick={handleButtonPass}
          disabled={isAnimating}
        >
          <X className="w-8 h-8 text-red-500" />
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="w-20 h-20 rounded-full border-2 border-green-500 hover:bg-green-500/10 hover:scale-110 transition-all shadow-lg"
          onClick={handleButtonLike}
          disabled={isAnimating}
        >
          <Heart className="w-10 h-10 text-green-500 fill-green-500" />
        </Button>
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>Drag the card or use the buttons below</p>
      </div>

      {/* NDA Modal */}
      {pendingConnection && (
        <NDAModal
          open={ndaModalOpen}
          onOpenChange={setNdaModalOpen}
          targetUserId={pendingConnection.targetUserId}
          targetUserName={pendingConnection.targetUserName}
          connectionId={pendingConnection.connectionId}
          onAccept={() => {
            toast({
              title: "Connection initiated!",
              description: `Waiting for ${pendingConnection.targetUserName} to sign the NDA`
            });
          }}
        />
      )}
    </div>
  );
}
