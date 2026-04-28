import { useEffect, useState, useCallback } from "react";

export type PlanTier = "free" | "starter" | "pro";

const STORAGE_KEY = "lexach.plan";

function readPlan(): PlanTier {
  if (typeof window === "undefined") return "free";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "starter" || v === "pro" ? v : "free";
}

/**
 * Client-side plan state. Defaults to "free".
 * NOTE: This is a UI-only gate for now — once billing is wired up,
 * replace `readPlan` with a server-backed subscription check.
 */
export function usePlan() {
  const [plan, setPlanState] = useState<PlanTier>(() => readPlan());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setPlanState(readPlan());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setPlan = useCallback((next: PlanTier) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setPlanState(next);
  }, []);

  const isPaid = plan === "starter" || plan === "pro";

  return {
    plan,
    setPlan,
    isPaid,
    isFree: plan === "free",
    isStarterOrAbove: isPaid,
    isPro: plan === "pro",
  };
}