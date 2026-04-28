import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Creates a Stripe Checkout Session for the requested plan and returns the
 * hosted-checkout URL to redirect the user to. If STRIPE_SECRET_KEY isn't set
 * yet, returns 501 with a friendly message so the UI can fall back gracefully.
 *
 * Request body: { plan: "starter" | "pro", success_path?: string, cancel_path?: string }
 */
const PLAN_PRICES: Record<string, { amount: number; interval: "month" | "year" | "one_time"; label: string }> = {
  starter: { amount: 49900, interval: "month", label: "Lexach Starter (1 month)" },
  pro:     { amount: 99900, interval: "one_time", label: "Lexach Pro (6 months)" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    const userId = claims?.claims?.sub as string | undefined;
    const email = claims?.claims?.email as string | undefined;
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const plan = String(body.plan ?? "");
    if (!PLAN_PRICES[plan]) return json({ error: "invalid_plan" }, 400);

    const origin = req.headers.get("origin") ?? "";
    const successPath = typeof body.success_path === "string" ? body.success_path : "/dashboard";
    const cancelPath  = typeof body.cancel_path  === "string" ? body.cancel_path  : "/pricing";
    const successUrl = `${origin}${successPath}?checkout=success&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl  = `${origin}${cancelPath}?checkout=cancelled`;

    if (!stripeKey) {
      // Stripe not enabled yet — surface a clear, actionable error to the UI.
      return json({
        error: "checkout_not_configured",
        message: "Payments aren't live yet. Add STRIPE_SECRET_KEY to enable checkout.",
        plan,
      }, 501);
    }

    const price = PLAN_PRICES[plan];
    const params = new URLSearchParams();
    params.set("mode", price.interval === "one_time" ? "payment" : "subscription");
    params.set("success_url", successUrl);
    params.set("cancel_url", cancelUrl);
    if (email) params.set("customer_email", email);
    params.set("client_reference_id", userId);
    params.set("metadata[user_id]", userId);
    params.set("metadata[plan]", plan);
    params.append("line_items[0][quantity]", "1");
    params.append("line_items[0][price_data][currency]", "inr");
    params.append("line_items[0][price_data][product_data][name]", price.label);
    params.append("line_items[0][price_data][unit_amount]", String(price.amount));
    if (price.interval !== "one_time") {
      params.append("line_items[0][price_data][recurring][interval]", price.interval);
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const session = await stripeRes.json();
    if (!stripeRes.ok) {
      console.error("stripe error", session);
      return json({ error: "stripe_error", details: session?.error?.message }, 502);
    }
    return json({ url: session.url, id: session.id, plan });
  } catch (e) {
    console.error("create-checkout error", e);
    return json({ error: "internal_error" }, 500);
  }

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});