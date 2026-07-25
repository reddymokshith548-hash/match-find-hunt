import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CheckoutPlan = "starter" | "pro";
export type BillingCycle = "monthly";

/**
 * Calls the create-checkout edge function and redirects the browser to the
 * returned Stripe Checkout URL. Falls back to a friendly toast when Stripe
 * isn't configured yet (HTTP 501).
 */
export function useCheckout() {
  const [loading, setLoading] = useState<CheckoutPlan | null>(null);

  const startCheckout = useCallback(async (plan: CheckoutPlan, _cycle: BillingCycle = "monthly") => {
    setLoading(plan);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          plan,
          cycle: "monthly",
          success_path: "/dashboard",
          cancel_path: "/pricing",
        },
      });

      if (error) {
        // Edge function returned non-2xx
        const ctx = (error as { context?: Response }).context;
        let message = "Checkout failed. Please try again.";
        try {
          const body = await ctx?.json();
          if (body?.error === "checkout_not_configured") {
            message = body.message ?? "Payments aren't live yet — check back soon.";
          } else if (body?.details) {
            message = body.details;
          }
        } catch { /* ignore */ }
        toast.info("Payments not yet enabled", { description: message });
        return;
      }

      if (data?.url) {
        window.location.href = data.url as string;
        return;
      }

      toast.error("Couldn't start checkout", {
        description: "No checkout URL returned. Try again in a moment.",
      });
    } catch (e) {
      console.error("startCheckout failed", e);
      toast.error("Checkout error", { description: "Something went wrong starting checkout." });
    } finally {
      setLoading(null);
    }
  }, []);

  return { startCheckout, loading };
}