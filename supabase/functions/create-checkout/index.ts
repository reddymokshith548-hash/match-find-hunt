import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Stripe checkout stub. Returns 501 with a friendly message until the Stripe
 * connection is enabled. When you're ready to take payments, wire this up to
 * stripe.checkout.sessions.create using the secret added by enable_stripe_payments.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      error: "checkout_not_configured",
      message:
        "Payments are not live yet. We'll email you the moment Pro checkout opens.",
    }),
    {
      status: 501,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});