import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";
import UpgradeCTA from "@/components/UpgradeCTA";
import { formatDistanceToNow } from "date-fns";
import { createConnectionRequest } from "@/lib/connectionHelpers";
import { toast } from "sonner";

interface IncomingLike {
  id: string;
  user_id: string;
  name: string;
  role: string | null;
  bio: string | null;
  profile_pic_url: string | null;
  location: string | null;
  skills: string[] | null;
  stage: string | null;
  liked_at: string | null;
}

interface ApiResponse {
  plan: "free" | "starter" | "pro";
  total: number;
  likes: IncomingLike[];
  upgrade_required: boolean;
}

export default function WhoLikedYou() {
  const { user } = useAuth();
  const { isPaid } = usePlan();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: res, error } = await supabase.functions.invoke("get-incoming-likes");
    if (error) {
      console.error("get-incoming-likes failed", error);
      toast.error("Couldn't load your likes");
      setLoading(false);
      return;
    }
    setData(res as ApiResponse);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setMyProfileId(data?.id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLikeBack = async (like: IncomingLike) => {
    if (!myProfileId) {
      toast.error("Profile not ready", { description: "Try refreshing the page." });
      return;
    }
    setActingId(like.id);
    try {
      const result = await createConnectionRequest(myProfileId, like.id);
      if (!result.success) {
        toast.info(result.error ?? "Couldn't send request");
      } else {
        toast.success("It's a match!", {
          description: `You and ${like.name} can now sign the NDA to start chatting.`,
        });
        await load();
      }
    } catch (e: any) {
      toast.error("Couldn't like back", { description: e?.message ?? "Try again." });
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading your likes…
      </div>
    );
  }

  const total = data?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Who liked you
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {total === 0
              ? "No one has liked you yet — keep swiping!"
              : `${total} ${total === 1 ? "person has" : "people have"} liked your profile.`}
          </p>
        </div>
      </div>

      {!isPaid && total > 0 && (
        <UpgradeCTA
          reason={`${total} ${total === 1 ? "person likes" : "people like"} you — upgrade to see who`}
          pendingLikes={total}
          variant="card"
        />
      )}

      {isPaid && data?.likes.length === 0 && total === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          You're all caught up. New likes will show up here.
        </Card>
      )}

      {isPaid && data?.likes && data.likes.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.likes.map((like) => (
            <Card key={like.id} variant="profile" className="p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={like.profile_pic_url ?? undefined} alt={like.name} />
                  <AvatarFallback>{like.name?.charAt(0) ?? "?"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{like.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {like.role}
                    {like.location ? ` · ${like.location}` : ""}
                  </p>
                  {like.liked_at && (
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      Liked {formatDistanceToNow(new Date(like.liked_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
              {like.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">{like.bio}</p>
              )}
              {like.skills && like.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {like.skills.slice(0, 3).map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px]">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
              <Button
                variant="hero"
                size="sm"
                className="mt-auto"
                disabled={actingId === like.id}
                onClick={() => handleLikeBack(like)}
              >
                <Heart className="w-4 h-4 mr-2" />
                {actingId === like.id ? "Connecting…" : "Like back"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}