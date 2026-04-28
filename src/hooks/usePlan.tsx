import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type PlanTier = "free" | "starter" | "pro";

/**
 * Reads the active plan tier from `public.subscriptions` for the current user.
 * Defaults to "free" when the user is signed-out, has no row, or while loading.
 *
 * IMPORTANT: this hook drives UX only. Server-side enforcement lives in:
 *   - public.get_user_plan() (RLS / RPC)
 *   - public.increment_daily_swipe() (10/day cap)
 *   - check-feature-access edge function
 * Never trust this value alone for anything that touches paid resources.
 */
export function usePlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanTier>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setPlan("free");
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const active =
          data &&
          ["active", "trialing"].includes(data.status) &&
          (!data.current_period_end ||
            new Date(data.current_period_end) > new Date());
        setPlan((active ? data!.plan : "free") as PlanTier);
        setLoading(false);
      });

    // Refresh on subscription updates (e.g. after Stripe webhook fires)
    const channel = supabase
      .channel(`subscription:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const next = (payload.new as { plan?: PlanTier; status?: string } | null);
          if (next?.plan && (next.status === "active" || next.status === "trialing")) {
            setPlan(next.plan);
          } else {
            setPlan("free");
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isPaid = plan === "starter" || plan === "pro";

  return {
    plan,
    loading,
    isPaid,
    isFree: plan === "free",
    isStarterOrAbove: isPaid,
    isPro: plan === "pro",
  };
}