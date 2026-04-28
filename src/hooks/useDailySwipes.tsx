import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";

export const FREE_DAILY_LIMIT = 10;

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Tracks the caller's swipe count for today. The DB is the source of truth —
 * `record_interaction` increments via `increment_daily_swipe` and rejects
 * free-tier users beyond 10/day. This hook just mirrors the count for UI.
 */
export function useDailySwipes() {
  const { user } = useAuth();
  const { plan, isPaid } = usePlan();
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setUsed(0);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("daily_swipe_counts")
      .select("count")
      .eq("user_id", user.id)
      .eq("swipe_date", todayUtc())
      .maybeSingle();
    setUsed(data?.count ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const limit = isPaid ? Infinity : FREE_DAILY_LIMIT;
  const remaining = isPaid ? Infinity : Math.max(0, FREE_DAILY_LIMIT - used);
  const exhausted = !isPaid && used >= FREE_DAILY_LIMIT;

  // Optimistic local bump used right after a successful interaction
  const bumpLocal = useCallback(() => {
    setUsed((n) => n + 1);
  }, []);

  return {
    plan,
    used,
    limit,
    remaining,
    exhausted,
    loading,
    refresh,
    bumpLocal,
  };
}