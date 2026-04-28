import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Server-side feature gate. The client never decides whether a feature is
 * available — it asks this function. Returns { plan, allowed, reason? }.
 */
const FEATURE_REQUIREMENTS: Record<string, "starter" | "pro"> = {
  advanced_filters: "starter",
  who_liked_you: "starter",
  unlimited_swipes: "starter",
  spark_rooms_post: "starter",
  verified_badge: "starter",
  read_receipts: "starter",
  deep_compatibility: "pro",
  ai_summaries: "pro",
  priority_placement: "pro",
};

const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, pro: 2 };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const { feature } = await req.json().catch(() => ({}));
    if (typeof feature !== "string" || !(feature in FEATURE_REQUIREMENTS)) {
      return json({ error: "unknown_feature" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    const userId = claims?.claims?.sub as string | undefined;
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: planData } = await admin.rpc("get_user_plan", {
      _user_id: userId,
    });
    const plan = (planData as string) || "free";
    const requiredPlan = FEATURE_REQUIREMENTS[feature];
    const allowed = (PLAN_RANK[plan] ?? 0) >= (PLAN_RANK[requiredPlan] ?? 99);

    return json({
      plan,
      feature,
      required_plan: requiredPlan,
      allowed,
      reason: allowed ? null : "upgrade_required",
    });
  } catch (e) {
    console.error("check-feature-access error", e);
    return json({ error: "internal_error" }, 500);
  }

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});