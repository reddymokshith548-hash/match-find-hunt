import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-trigger",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

type Kind = "new_match" | "new_message";

interface Payload {
  kind: Kind;
  recipient_user_id: string;
  payload: Record<string, unknown>;
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function baseLayout(opts: {
  appUrl: string;
  title: string;
  preheader: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  const { appUrl, title, preheader, bodyHtml, ctaLabel, ctaUrl } = opts;
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f6f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
<span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,.06);">
      <tr><td style="padding:28px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;">
        <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;opacity:.85;">Lexach</div>
        <div style="font-size:22px;font-weight:700;margin-top:6px;">${title}</div>
      </td></tr>
      <tr><td style="padding:28px 32px;font-size:15px;line-height:1.6;color:#334155;">
        ${bodyHtml}
        ${ctaLabel && ctaUrl ? `<div style="margin:28px 0 8px;"><a href="${ctaUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">${ctaLabel}</a></div>` : ""}
        <p style="margin-top:28px;color:#64748b;font-size:13px;">— The Lexach Team</p>
      </td></tr>
      <tr><td style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:center;">
        <a href="${appUrl}" style="color:#6366f1;text-decoration:none;">${appUrl.replace(/^https?:\/\//, "")}</a> · <a href="${appUrl}/settings" style="color:#94a3b8;">Manage notifications</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function renderMatch(name: string, otherName: string, score: number, appUrl: string) {
  const safeName = escape(name);
  const safeOther = escape(otherName);
  return {
    subject: `🤝 New co-founder match on Lexach (${score}%)`,
    html: baseLayout({
      appUrl,
      title: "You have a new match",
      preheader: `${otherName} matched with you on Lexach (${score}% compatible).`,
      ctaLabel: "Open Lexach",
      ctaUrl: `${appUrl}/dashboard`,
      bodyHtml: `
        <p>Hi ${safeName},</p>
        <p>You just matched with <strong>${safeOther}</strong> on Lexach with a <strong>${score}% compatibility score</strong>.</p>
        <p>Open your dashboard to view their profile, see your compatibility breakdown, and start a connection.</p>
      `,
    }),
  };
}

function renderMessage(name: string, senderName: string, snippet: string, appUrl: string) {
  const safeName = escape(name);
  const safeSender = escape(senderName);
  const safeSnippet = escape(snippet || "(no preview available)");
  return {
    subject: `💬 New message from ${senderName} on Lexach`,
    html: baseLayout({
      appUrl,
      title: `New message from ${senderName}`,
      preheader: `${senderName}: ${snippet}`,
      ctaLabel: "Open chat",
      ctaUrl: `${appUrl}/messages`,
      bodyHtml: `
        <p>Hi ${safeName},</p>
        <p><strong>${safeSender}</strong> just sent you a message:</p>
        <blockquote style="margin:14px 0;padding:12px 16px;border-left:3px solid #6366f1;background:#f8fafc;color:#334155;border-radius:4px;">
          ${safeSnippet}
        </blockquote>
        <p>Reply right from your Lexach inbox.</p>
      `,
    }),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const internal = req.headers.get("x-internal-trigger") === "lexach-db-trigger";
    if (!internal) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY_1") ?? Deno.env.get("RESEND_API_KEY");
    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      return new Response(JSON.stringify({ ok: false, error: "missing email creds" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = (await req.json()) as Payload;
    if (!body?.kind || !body?.recipient_user_id) {
      return new Response(JSON.stringify({ error: "bad request" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Settings
    const { data: settings } = await admin
      .from("email_settings").select("*").eq("id", true).maybeSingle();
    if (!settings || settings.enabled === false) {
      return new Response(JSON.stringify({ ok: true, skipped: "emails_disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const fromName = settings.from_name ?? "Lexach";
    const fromEmail = settings.from_email ?? "onboarding@resend.dev";
    const appUrl = settings.app_url ?? "https://lexach.vercel.app";
    const replyTo = (settings.reply_to as string | null | undefined)?.trim() || undefined;

    // Recipient profile + email
    const { data: profile } = await admin
      .from("profiles").select("name,last_active")
      .eq("user_id", body.recipient_user_id).maybeSingle();
    const { data: userRow } = await admin.auth.admin.getUserById(body.recipient_user_id);
    const recipientEmail = userRow?.user?.email;
    if (!recipientEmail) {
      return new Response(JSON.stringify({ ok: true, skipped: "no_email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const recipientName = profile?.name ?? "there";

    // Preferences
    const { data: prefs } = await admin
      .from("notification_preferences").select("*")
      .eq("user_id", body.recipient_user_id).maybeSingle();
    if (body.kind === "new_match" && prefs && prefs.email_new_match === false) {
      return new Response(JSON.stringify({ ok: true, skipped: "pref_off" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.kind === "new_message" && prefs && prefs.email_new_message === false) {
      return new Response(JSON.stringify({ ok: true, skipped: "pref_off" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let subject = "";
    let html = "";
    let refId: string | null = null;

    if (body.kind === "new_match") {
      const score = Number((body.payload as any)?.score ?? 0);
      if (score < 60) {
        return new Response(JSON.stringify({ ok: true, skipped: "low_score" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const otherUserId = (body.payload as any)?.other_user_id as string | undefined;
      let otherName = "a new founder";
      if (otherUserId) {
        const { data: other } = await admin
          .from("profiles").select("name").eq("user_id", otherUserId).maybeSingle();
        if (other?.name) otherName = other.name;
      }
      refId = ((body.payload as any)?.match_id as string) ?? null;
      const r = renderMatch(recipientName, otherName, score, appUrl);
      subject = r.subject; html = r.html;
    } else if (body.kind === "new_message") {
      // Online cooldown: skip if active in last 2 minutes
      if (profile?.last_active) {
        const last = new Date(profile.last_active).getTime();
        if (Date.now() - last < 2 * 60 * 1000) {
          return new Response(JSON.stringify({ ok: true, skipped: "recipient_online" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      // 30-min per-conversation cooldown
      const connectionId = (body.payload as any)?.connection_id as string | undefined;
      if (connectionId) {
        const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: recent } = await admin
          .from("email_send_log")
          .select("id")
          .eq("user_id", body.recipient_user_id)
          .eq("kind", "new_message")
          .eq("ref_id", connectionId)
          .gte("sent_at", since)
          .limit(1);
        if (recent && recent.length > 0) {
          return new Response(JSON.stringify({ ok: true, skipped: "cooldown" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        refId = connectionId;
      }
      const senderUserId = (body.payload as any)?.sender_user_id as string | undefined;
      let senderName = "Someone";
      if (senderUserId) {
        const { data: s } = await admin
          .from("profiles").select("name").eq("user_id", senderUserId).maybeSingle();
        if (s?.name) senderName = s.name;
      }
      const snippet = String((body.payload as any)?.snippet ?? "");
      const r = renderMessage(recipientName, senderName, snippet, appUrl);
      subject = r.subject; html = r.html;
    } else {
      return new Response(JSON.stringify({ error: "unknown kind" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [recipientEmail],
        reply_to: replyTo,
        subject,
        html,
      }),
    });

    const result = await resp.json();
    if (!resp.ok) {
      console.error("Resend error", resp.status, result);
      return new Response(JSON.stringify({ ok: false, status: resp.status, error: result }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("email_send_log").insert({
      user_id: body.recipient_user_id,
      kind: body.kind,
      ref_id: refId,
    });

    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("send-notification-email error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});