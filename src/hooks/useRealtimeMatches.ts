import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface NewMatchPayload {
  id: string;
  user1_id: string;
  user2_id: string;
  match_score: number | null;
  final_score: number | null;
  created_at: string;
}

interface UseRealtimeMatchesOptions {
  minScoreForNotification?: number; // Only notify for high-compatibility matches
  onNewMatch?: (match: NewMatchPayload) => void;
}

export function useRealtimeMatches(options: UseRealtimeMatchesOptions = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { minScoreForNotification = 70, onNewMatch } = options;
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to matches table for new high-compatibility matches
    const channel = supabase
      .channel('realtime-matches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
        },
        async (payload) => {
          const newMatch = payload.new as NewMatchPayload;
          
          // Check if this match involves the current user
          if (newMatch.user1_id !== user.id && newMatch.user2_id !== user.id) {
            return;
          }

          const score = newMatch.final_score || newMatch.match_score || 0;
          
          // Only show notification for high-compatibility matches
          if (score >= minScoreForNotification) {
            // Get the other user's profile
            const otherUserId = newMatch.user1_id === user.id 
              ? newMatch.user2_id 
              : newMatch.user1_id;

            const { data: otherProfile } = await supabase
              .from('profiles')
              .select('name, profile_pic_url')
              .eq('user_id', otherUserId)
              .single();

            toast({
              title: "🎯 High-Compatibility Match!",
              description: `You have a ${score}% match with ${otherProfile?.name || 'a new founder'}!`,
            });
          }

          // Call the callback if provided
          onNewMatch?.(newMatch);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
        },
        async (payload) => {
          const updatedMatch = payload.new as NewMatchPayload;
          const oldMatch = payload.old as NewMatchPayload;
          
          // Check if this match involves the current user
          if (updatedMatch.user1_id !== user.id && updatedMatch.user2_id !== user.id) {
            return;
          }

          const newScore = updatedMatch.final_score || updatedMatch.match_score || 0;
          const oldScore = oldMatch.final_score || oldMatch.match_score || 0;

          // Notify if score improved significantly (by at least 10 points)
          if (newScore >= minScoreForNotification && newScore - oldScore >= 10) {
            const otherUserId = updatedMatch.user1_id === user.id 
              ? updatedMatch.user2_id 
              : updatedMatch.user1_id;

            const { data: otherProfile } = await supabase
              .from('profiles')
              .select('name')
              .eq('user_id', otherUserId)
              .single();

            toast({
              title: "📈 Match Compatibility Improved!",
              description: `Your compatibility with ${otherProfile?.name || 'a founder'} increased to ${newScore}%!`,
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, minScoreForNotification, onNewMatch, toast]);

  return { isSubscribed: !!channelRef.current };
}
