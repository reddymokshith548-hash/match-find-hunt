import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Returns the list of users who liked the caller and have NOT been liked back yet.
 * - Free users: count + minimal placeholder rows (no PII).
 * - Starter/Pro: full profile cards (name, role, bio, photo, skills, location).
 *
 * Plan tier is read server-side from public.get_user_plan(auth.uid()),
 * so a client cannot bypass the check by tampering with localStorage.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate the user JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: authErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !claims?.claims?.sub) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claims.claims.sub as string;

    // Service-role client to safely read plan + cross-user profile data
    const admin = createClient(supabaseUrl, serviceKey);

    // Resolve plan
    const { data: planData, error: planErr } = await admin.rpc("get_user_plan", {
      _user_id: userId,
    });
    if (planErr) {
      console.error("get_user_plan failed", planErr);
      return json({ error: "plan_lookup_failed" }, 500);
    }
    const plan = (planData as string) || "free";

    // Likes received (exclude ones the viewer already liked back)
    const { data: incoming, error: likesErr } = await admin
      .from("user_interactions")
      .select("user_id, created_at")
      .eq("target_user_id", userId)
      .eq("interaction_type", "like")
      .order("created_at", { ascending: false })
      .limit(100);

    if (likesErr) {
      console.error("incoming likes fetch failed", likesErr);
      return json({ error: "fetch_failed" }, 500);
    }

    const likerUserIds = Array.from(
      new Set((incoming ?? []).map((r) => r.user_id))
    );

    // Filter out users the viewer has already liked back (would be a match, not a pending like)
    const { data: myLikes } = await admin
      .from("user_interactions")
      .select("target_user_id")
      .eq("user_id", userId)
      .eq("interaction_type", "like")
      .in("target_user_id", likerUserIds.length ? likerUserIds : ["00000000-0000-0000-0000-000000000000"]);

    const likedBack = new Set((myLikes ?? []).map((r) => r.target_user_id));
    const pendingLikerIds = likerUserIds.filter((id) => !likedBack.has(id));

    const totalCount = pendingLikerIds.length;

    if (plan === "free") {
      return json({
        plan,
        total: totalCount,
        likes: [], // hidden until upgrade
        upgrade_required: true,
      });
    }

    if (totalCount === 0) {
      return json({ plan, total: 0, likes: [], upgrade_required: false });
    }

    const { data: profiles, error: profErr } = await admin
      .from("profiles")
      .select("id, user_id, name, role, bio, profile_pic_url, location, skills, stage")
      .in("user_id", pendingLikerIds);

    if (profErr) {
      console.error("profile fetch failed", profErr);
      return json({ error: "profile_fetch_failed" }, 500);
    }

    // Preserve "newest like first" ordering
    const orderIndex = new Map(pendingLikerIds.map((id, i) => [id, i]));
    const likedAtByUser = new Map(
      (incoming ?? []).map((r) => [r.user_id, r.created_at])
    );
    const ordered = (profiles ?? [])
      .sort(
        (a, b) =>
          (orderIndex.get(a.user_id) ?? 0) - (orderIndex.get(b.user_id) ?? 0)
      )
      .map((p) => ({ ...p, liked_at: likedAtByUser.get(p.user_id) ?? null }));

    return json({
      plan,
      total: totalCount,
      likes: ordered,
      upgrade_required: false,
    });
  } catch (e) {
    console.error("get-incoming-likes error", e);
    return json({ error: "internal_error" }, 500);
  }

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});