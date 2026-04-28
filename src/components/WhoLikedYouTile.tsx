import { useEffect, useState } from "react";
import { Heart, ArrowRight, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";

/**
 * Compact dashboard tile: shows the incoming-like count and links to the
 * full /who-liked-you page. Free users see a locked CTA, paid users see a
 * direct "View" CTA.
 */
export default function WhoLikedYouTile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPaid } = usePlan();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("my_incoming_likes_count").then(({ data }) => {
      setCount(typeof data === "number" ? data : 0);
    });
  }, [user]);

  return (
    <Card
      variant="profile"
      className="p-5 flex items-center justify-between gap-4 bg-gradient-to-br from-primary/5 via-background to-background"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="rounded-full bg-primary/15 p-2.5 shrink-0">
          <Heart className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold leading-tight">Who liked you</p>
          <p className="text-xs text-muted-foreground">
            {count === null
              ? "Loading…"
              : count === 0
                ? "No new likes yet"
                : `${count} ${count === 1 ? "person has" : "people have"} liked you`}
          </p>
        </div>
        {count !== null && count > 0 && (
          <Badge variant="secondary" className="ml-1 shrink-0">{count}</Badge>
        )}
      </div>
      <Button
        variant={isPaid ? "hero" : "outline"}
        size="sm"
        onClick={() => navigate(isPaid ? "/who-liked-you" : "/pricing")}
        className="shrink-0"
      >
        {isPaid ? (
          <>View <ArrowRight className="w-3.5 h-3.5 ml-1" /></>
        ) : (
          <><Lock className="w-3.5 h-3.5 mr-1" /> Unlock</>
        )}
      </Button>
    </Card>
  );
}