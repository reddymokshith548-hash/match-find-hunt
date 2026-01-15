import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  Calendar,
  Globe,
  Lock,
  MessageCircle,
  Crown,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow, format } from 'date-fns';

interface RoomMember {
  id: string;
  name: string;
  profile_pic_url?: string | null;
  user_id?: string;
  joined_at?: string;
}

interface SparkRoomInfo {
  id: string;
  name: string;
  description?: string | null;
  topic?: string | null;
  is_public: boolean;
  created_at: string;
  creator_id: string;
}

interface SparkRoomInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  onLeaveRoom: () => void;
  onProfileClick?: (profileId: string) => void;
}

export default function SparkRoomInfoDialog({
  open,
  onOpenChange,
  roomId,
  onLeaveRoom,
  onProfileClick,
}: SparkRoomInfoDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roomInfo, setRoomInfo] = useState<SparkRoomInfo | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [creatorProfile, setCreatorProfile] = useState<RoomMember | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (open && roomId) {
      fetchRoomInfo();
      fetchUserProfile();
    }
  }, [open, roomId]);

  // Realtime subscription for member updates
  useEffect(() => {
    if (!open || !roomId) return;

    const channel = supabase
      .channel(`room-members-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'spark_room_members',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the new member's profile
            const newMember = payload.new as { user_id: string; joined_at: string };
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, name, profile_pic_url')
              .eq('user_id', newMember.user_id)
              .maybeSingle();

            if (profile) {
              setMembers((prev) => [
                ...prev,
                {
                  ...profile,
                  user_id: newMember.user_id,
                  joined_at: newMember.joined_at,
                },
              ]);
            }
          } else if (payload.eventType === 'DELETE') {
            const leftMember = payload.old as { user_id: string };
            setMembers((prev) =>
              prev.filter((m) => m.user_id !== leftMember.user_id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, roomId]);

  // Realtime subscription for profile name/picture updates
  useEffect(() => {
    if (!open || members.length === 0) return;

    const userIds = members.map((m) => m.user_id).filter(Boolean);
    if (userIds.length === 0) return;

    const channel = supabase
      .channel(`room-profiles-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const updated = payload.new as { user_id: string; name: string; profile_pic_url: string | null; id: string };
          // Update member if they're in this room
          setMembers((prev) =>
            prev.map((m) =>
              m.user_id === updated.user_id
                ? { ...m, name: updated.name, profile_pic_url: updated.profile_pic_url }
                : m
            )
          );
          // Update creator profile if needed
          if (creatorProfile && updated.id === creatorProfile.id) {
            setCreatorProfile((prev) =>
              prev ? { ...prev, name: updated.name, profile_pic_url: updated.profile_pic_url } : null
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, roomId, members.length, creatorProfile?.id]);

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) setUserProfileId(data.id);
  };

  const fetchRoomInfo = async () => {
    setLoading(true);
    try {
      // Fetch room details
      const { data: room, error: roomError } = await supabase
        .from('spark_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;
      setRoomInfo(room);

      // Fetch creator profile
      const { data: creator } = await supabase
        .from('profiles')
        .select('id, name, profile_pic_url')
        .eq('user_id', room.creator_id)
        .maybeSingle();

      if (creator) setCreatorProfile(creator);

      // Fetch members with join dates
      const { data: membersData } = await supabase
        .from('spark_room_members')
        .select(`
          joined_at,
          user_id,
          profiles:profiles!spark_room_members_user_id_fkey(id, name, profile_pic_url)
        `)
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true });

      const memberList: RoomMember[] = (membersData || [])
        .filter((m: any) => m.profiles)
        .map((m: any) => ({
          ...m.profiles,
          user_id: m.user_id,
          joined_at: m.joined_at,
        }));

      setMembers(memberList);

      // Fetch message count
      const { count } = await supabase
        .from('spark_room_messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId);

      setMessageCount(count || 0);
    } catch (error) {
      console.error('Error fetching room info:', error);
    } finally {
      setLoading(false);
    }
  };

  const isCreator = roomInfo?.creator_id === user?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] p-0 overflow-hidden">
        <ScrollArea className="max-h-[85vh]">
          <div className="p-6">
            <DialogHeader className="text-center pb-4">
              {/* Room Avatar */}
              <div className="flex justify-center mb-4">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                  <Users className="h-12 w-12 text-primary-foreground" />
                </div>
              </div>

              <DialogTitle className="text-2xl font-bold">
                {roomInfo?.name || 'Loading...'}
              </DialogTitle>

              {roomInfo?.topic && (
                <Badge variant="secondary" className="mx-auto mt-2">
                  {roomInfo.topic}
                </Badge>
              )}

              <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
                {roomInfo?.is_public ? (
                  <>
                    <Globe className="h-4 w-4" />
                    <span>Public Group</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Private Group</span>
                  </>
                )}
                <span>•</span>
                <span>{members.length} participants</span>
              </div>
            </DialogHeader>

            {/* Description */}
            {roomInfo?.description && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {roomInfo.description}
                </p>
              </div>
            )}

            <Separator className="my-4" />

            {/* Room Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">
                    {roomInfo
                      ? format(new Date(roomInfo.created_at), 'MMM d, yyyy')
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Messages</p>
                  <p className="text-sm font-medium">
                    {messageCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Members Section */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                {members.length} Participants
              </h3>

              <div className="space-y-1">
                {members.map((member) => {
                  const isAdmin = member.user_id === roomInfo?.creator_id;
                  const isCurrentUser = member.id === userProfileId;

                  const handleProfileClick = () => {
                    if (onProfileClick) {
                      onProfileClick(member.id);
                    } else {
                      // Navigate to profile page
                      onOpenChange(false);
                      navigate(`/profile/${member.id}`);
                    }
                  };

                  return (
                    <button
                      key={member.id}
                      onClick={handleProfileClick}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left group"
                    >
                      <Avatar className="h-11 w-11 ring-2 ring-background">
                        <AvatarImage src={member.profile_pic_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {member.name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {member.name}
                          </span>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs py-0">
                              You
                            </Badge>
                          )}
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-1 text-xs text-primary">
                            <Crown className="h-3 w-3" />
                            <span>Group Admin</span>
                          </div>
                        )}
                        {member.joined_at && !isAdmin && (
                          <p className="text-xs text-muted-foreground">
                            Joined{' '}
                            {formatDistanceToNow(new Date(member.joined_at), {
                              addSuffix: true,
                            })}
                          </p>
                        )}
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Actions */}
            <div className="space-y-2">
              <Button
                variant="destructive"
                className="w-full justify-start gap-2"
                onClick={() => {
                  onLeaveRoom();
                  onOpenChange(false);
                }}
              >
                <LogOut className="h-4 w-4" />
                Exit Group
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
