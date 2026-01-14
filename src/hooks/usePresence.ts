import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceState {
  onlineUsers: Set<string>;
  typingUsers: Map<string, { isTyping: boolean; conversationId: string }>;
}

export function usePresence(userId: string | null, conversationId: string | null) {
  const [presenceState, setPresenceState] = useState<PresenceState>({
    onlineUsers: new Set(),
    typingUsers: new Map(),
  });
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Track online status
  useEffect(() => {
    if (!userId) return;

    const presenceChannel = supabase.channel('online-users', {
      config: { presence: { key: userId } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineIds = new Set(Object.keys(state));
        setPresenceState(prev => ({ ...prev, onlineUsers: onlineIds }));
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setPresenceState(prev => ({
          ...prev,
          onlineUsers: new Set([...prev.onlineUsers, key]),
        }));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setPresenceState(prev => {
          const newOnline = new Set(prev.onlineUsers);
          newOnline.delete(key);
          return { ...prev, onlineUsers: newOnline };
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

    setChannel(presenceChannel);

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [userId]);

  // Typing indicator channel per conversation
  useEffect(() => {
    if (!userId || !conversationId) return;

    const typingChannel = supabase.channel(`typing:${conversationId}`, {
      config: { presence: { key: userId } },
    });

    typingChannel
      .on('presence', { event: 'sync' }, () => {
        const state = typingChannel.presenceState();
        const typingMap = new Map<string, { isTyping: boolean; conversationId: string }>();
        
        Object.entries(state).forEach(([key, presences]) => {
          const presence = presences[0] as any;
          if (presence?.isTyping) {
            typingMap.set(key, { isTyping: true, conversationId });
          }
        });
        
        setPresenceState(prev => ({ ...prev, typingUsers: typingMap }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [userId, conversationId]);

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!userId || !conversationId) return;

    const typingChannel = supabase.channel(`typing:${conversationId}`);
    await typingChannel.track({ isTyping, user_id: userId });
  }, [userId, conversationId]);

  const isUserOnline = useCallback((checkUserId: string) => {
    return presenceState.onlineUsers.has(checkUserId);
  }, [presenceState.onlineUsers]);

  const isUserTyping = useCallback((checkUserId: string) => {
    const typing = presenceState.typingUsers.get(checkUserId);
    return typing?.isTyping ?? false;
  }, [presenceState.typingUsers]);

  return {
    isUserOnline,
    isUserTyping,
    setTyping,
    onlineCount: presenceState.onlineUsers.size,
  };
}
