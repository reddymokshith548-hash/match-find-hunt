import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// DODO Payments product IDs (test mode)
const PRODUCT_IDS: Record<string, string> = {
  starter: "pdt_0NjfmM1mFlczj3BrxvPkV",
  pro:     "pdt_0Njfo8F2EyOs2kSEYrqTu",
};

const DODO_BASE = Deno.env.get("DODO_PAYMENTS_BASE_URL") ?? "https://test.dodopayments.com";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const dodoKey = Deno.env.get("DODO_PAYMENTS_API_KEY");

    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    let userId: string | undefined;
    let email: string | undefined;

    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userData?.user) {
      userId = userData.user.id;
      email = userData.user.email ?? undefined;
    } else {
      console.warn("getUser failed, trying getClaims", userErr?.message);
      const { data: claims } = await userClient.auth.getClaims(token);
      userId = claims?.claims?.sub as string | undefined;
      email = claims?.claims?.email as string | undefined;
    }

    if (!userId) {
      console.error("unauthorized: could not resolve user from token");
      return json({ error: "Unauthorized", details: "Session invalid — please sign out and sign in again." }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const plan = String(body.plan ?? "");
    const productId = PRODUCT_IDS[plan];
    if (!productId) return json({ error: "invalid_plan" }, 400);

    if (!dodoKey) {
      return json({
        error: "checkout_not_configured",
        message: "Payments aren't live yet. DODO_PAYMENTS_API_KEY is missing.",
      }, 501);
    }

    const origin = req.headers.get("origin") ?? "";
    const successPath = typeof body.success_path === "string" ? body.success_path : "/dashboard";
    const returnUrl = `${origin}${successPath}?checkout=success&plan=${plan}`;

    // Load profile for name/address
    const svc = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: profile } = await svc
      .from("profiles").select("name, location").eq("user_id", userId).maybeSingle();

    const customerName = profile?.name || (email ? email.split("@")[0] : "Lexach User");

    // Create a subscription on Dodo Payments
    const payload = {
      product_id: productId,
      quantity: 1,
      payment_link: true,
      return_url: returnUrl,
      customer: {
        email: email ?? "no-reply@lexach.com",
        name: customerName,
      },
      billing: {
        city: "NA",
        country: "IN",
        state: "NA",
        street: "NA",
        zipcode: "000000",
      },
      metadata: {
        user_id: userId,
        plan,
      },
    };

    const res = await fetch(`${DODO_BASE}/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${dodoKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("dodo error", res.status, data);
      return json({ error: "dodo_error", details: data?.message ?? JSON.stringify(data) }, 502);
    }

    const url = data.payment_link ?? data.checkout_url ?? data.url;
    const subscriptionId = data.subscription_id ?? data.id ?? null;

    // Track pending order
    await svc.from("payment_orders").insert({
      user_id: userId,
      plan,
      provider: "dodo",
      provider_order_id: subscriptionId,
      amount: null,
      currency: "INR",
      status: "created",
    });

    if (!url) return json({ error: "no_payment_link", details: data }, 502);
    return json({ url, id: subscriptionId, plan });
  } catch (e) {
    console.error("create-checkout error", e);
    return json({ error: "internal_error", details: String(e) }, 500);
  }

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
