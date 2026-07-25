import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
};

/**
 * DODO Payments webhook.
 * Verifies Standard Webhooks signature (HMAC SHA256, base64) and activates
 * subscriptions when a payment succeeds.
 *
 * Set verify_jwt = false for this function in supabase/config.toml.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const secret = Deno.env.get("DODO_PAYMENTS_WEBHOOK_SECRET");
  if (!secret) return json({ error: "webhook_not_configured" }, 501);

  const id = req.headers.get("webhook-id") ?? "";
  const timestamp = req.headers.get("webhook-timestamp") ?? "";
  const signatureHeader = req.headers.get("webhook-signature") ?? "";
  const raw = await req.text();

  if (!id || !timestamp || !signatureHeader) {
    return json({ error: "missing_signature_headers" }, 400);
  }

  // Standard Webhooks: signed = `${id}.${timestamp}.${body}`; key is base64 after "whsec_"
  const keyBase64 = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let keyBytes: Uint8Array;
  try {
    keyBytes = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));
  } catch {
    keyBytes = new TextEncoder().encode(secret);
  }

  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const toSign = new TextEncoder().encode(`${id}.${timestamp}.${raw}`);
  const sigBuf = await crypto.subtle.sign("HMAC", cryptoKey, toSign);
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));

  const provided = signatureHeader.split(" ").map((s) => s.split(",")[1]).filter(Boolean);
  const ok = provided.some((s) => timingSafeEqual(s, expected));
  if (!ok) {
    console.warn("dodo-webhook signature mismatch");
    return json({ error: "invalid_signature" }, 401);
  }

  let event: any;
  try { event = JSON.parse(raw); } catch { return json({ error: "bad_json" }, 400); }

  const svc = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const type: string = event.type ?? event.event_type ?? "";
  const data = event.data ?? event;
  const meta = data.metadata ?? {};
  const userId: string | undefined = meta.user_id;
  const plan: string | undefined = meta.plan;
  const subscriptionId: string | undefined = data.subscription_id ?? data.id;

  console.log("dodo webhook", type, { userId, plan, subscriptionId });

  if (!userId || !plan) {
    return json({ ok: true, note: "no_metadata" });
  }

  const succeeded =
    type.includes("succeeded") ||
    type.includes("active") ||
    type === "subscription.created" ||
    type === "payment.succeeded";
  const cancelled =
    type.includes("cancelled") || type.includes("canceled") || type.includes("failed") || type.includes("expired");

  if (succeeded) {
    // Activate subscription
    const periodEnd = plan === "pro" || plan === "starter"
      ? new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: existing } = await svc.from("subscriptions").select("id").eq("user_id", userId).maybeSingle();
    if (existing) {
      await svc.from("subscriptions").update({
        plan, status: "active", current_period_end: periodEnd, updated_at: new Date().toISOString(),
      }).eq("user_id", userId);
    } else {
      await svc.from("subscriptions").insert({
        user_id: userId, plan, status: "active", current_period_end: periodEnd,
      });
    }
    await svc.from("payment_orders")
      .update({ status: "paid" })
      .eq("provider_order_id", subscriptionId ?? "");
  } else if (cancelled) {
    await svc.from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    await svc.from("payment_orders")
      .update({ status: "failed" })
      .eq("provider_order_id", subscriptionId ?? "");
  }

  return json({ ok: true });

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
