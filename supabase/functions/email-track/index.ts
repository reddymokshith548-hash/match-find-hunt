import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Public endpoint hit by email clients (image pixel) and recipients (link click).
// No CORS preflight needed for image/redirect requests, but we keep headers permissive.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

// 1x1 transparent GIF
const PIXEL = Uint8Array.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00,
  0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00,
  0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02,
  0x44, 0x01, 0x00, 0x3b,
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_HOSTS = new Set([
  "lexach.vercel.app",
  "lexach.com",
  "www.lexach.com",
  "id-preview--297ea7e7-8724-42f2-b957-eae978502b45.lovable.app",
]);

function isSafeRedirect(url: string) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return ALLOWED_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  // Pathing: /email-track/open or /email-track/click  (Supabase routes /functions/v1/email-track/*)
  const segs = url.pathname.split("/").filter(Boolean);
  const action = segs[segs.length - 1]; // "open" | "click"

  const messageId = url.searchParams.get("m") || "";
  const userId = url.searchParams.get("u") || "";
  const kind = url.searchParams.get("k") || "";
  const refId = url.searchParams.get("r") || "";
  const dest = url.searchParams.get("d") || "";

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const validMid = UUID_RE.test(messageId) ? messageId : null;
  const validUid = UUID_RE.test(userId) ? userId : null;
  const validRef = UUID_RE.test(refId) ? refId : null;
  const validKind = kind === "new_match" || kind === "new_message" ? kind : "unknown";

  const userAgent = req.headers.get("user-agent") || "";
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "";

  if (validMid) {
    try {
      await admin.from("email_events").insert({
        message_id: validMid,
        user_id: validUid,
        kind: validKind,
        event_type: action === "click" ? "click" : "open",
        ref_id: validRef,
        url: action === "click" ? dest.slice(0, 2000) : null,
        user_agent: userAgent.slice(0, 500),
        ip: ip.slice(0, 64),
      });
    } catch (e) {
      console.error("email-track insert failed", e);
    }
  }

  if (action === "click") {
    const target = isSafeRedirect(dest) ? dest : "https://lexach.vercel.app";
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: target, "Cache-Control": "no-store" },
    });
  }

  return new Response(PIXEL, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Content-Length": String(PIXEL.byteLength),
    },
  });
});