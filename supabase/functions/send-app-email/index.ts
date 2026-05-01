import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

type TemplateName = "pro_upgrade" | "role_granted" | "role_revoked";

interface Payload {
  template: TemplateName;
  to: string;
  data?: {
    name?: string;
    role?: string;
  };
  preview?: boolean; // if true, render but do not send
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
        <a href="${appUrl}" style="color:#6366f1;text-decoration:none;">${appUrl.replace(/^https?:\/\//, "")}</a> · You received this because you have an account with Lexach.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function render(template: TemplateName, data: { name?: string; role?: string } = {}, appUrl: string) {
  const name = (data.name || "there").trim();
  const role = (data.role || "member").toString();

  if (template === "pro_upgrade") {
    return {
      subject: "🎉 You're now Lexach Pro — welcome to the Beta!",
      html: baseLayout({
        appUrl,
        title: "Welcome to Lexach Pro",
        preheader: "Your account has been upgraded — explore the beta now.",
        ctaLabel: "Open Lexach",
        ctaUrl: appUrl,
        bodyHtml: `
          <p>Hi ${name},</p>
          <p><strong>You've been upgraded to Lexach Pro.</strong> 🎉</p>
          <p>We're thrilled to have you as part of the <strong>Lexach Beta</strong> — a new way for founders, builders, and operators to discover deeply-compatible co-founder matches through our deterministic FounderSync engine.</p>
          <p>As a Pro member you now get:</p>
          <ul style="padding-left:18px;margin:8px 0;">
            <li>Unlimited daily matches & swipes</li>
            <li>Full access to FounderSync compatibility breakdowns</li>
            <li>See who liked you</li>
            <li>Priority NDA-secured chat unlocks</li>
          </ul>
          <p>Jump in and explore — your dashboard is live at <a href="${appUrl}" style="color:#6366f1;">${appUrl}</a>.</p>
          <p>Thanks for helping us shape Lexach during beta. Reply to this email anytime with feedback — we read every one.</p>
        `,
      }),
    };
  }

  if (template === "role_granted") {
    return {
      subject: `You've been granted ${role} access on Lexach`,
      html: baseLayout({
        appUrl,
        title: `${role.charAt(0).toUpperCase() + role.slice(1)} access granted`,
        preheader: `You now have ${role} permissions on Lexach.`,
        ctaLabel: "Open admin console",
        ctaUrl: `${appUrl}/admin/login`,
        bodyHtml: `
          <p>Hi ${name},</p>
          <p>You've just been granted the <strong>${role}</strong> role on Lexach.</p>
          <p>This gives you elevated access to manage parts of the platform during the beta. Please use it responsibly — every action is recorded in our audit log.</p>
          <p>Visit <a href="${appUrl}" style="color:#6366f1;">${appUrl}</a> to get started.</p>
        `,
      }),
    };
  }

  // role_revoked
  return {
    subject: `Your ${role} access on Lexach has been removed`,
    html: baseLayout({
      appUrl,
      title: `${role.charAt(0).toUpperCase() + role.slice(1)} access removed`,
      preheader: `Your ${role} permissions on Lexach have been revoked.`,
      ctaLabel: "Open Lexach",
      ctaUrl: appUrl,
      bodyHtml: `
        <p>Hi ${name},</p>
        <p>Your <strong>${role}</strong> role on Lexach has been revoked. Your standard account remains active and unaffected — you can keep using Lexach normally at <a href="${appUrl}" style="color:#6366f1;">${appUrl}</a>.</p>
        <p>If you believe this was a mistake, please reply to this email.</p>
      `,
    }),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY_1") ?? Deno.env.get("RESEND_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await admin.from("user_roles")
      .select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Payload;
    if (!body?.template || !body?.to) {
      return new Response(JSON.stringify({ error: "template and to required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: settings } = await admin.from("email_settings").select("*").eq("id", true).maybeSingle();
    const enabled = settings?.enabled ?? true;
    const fromName = settings?.from_name ?? "Lexach";
    const fromEmail = settings?.from_email ?? "onboarding@resend.dev";
    const appUrl = settings?.app_url ?? "https://lexach.vercel.app";
    const replyTo = (settings?.reply_to as string | null | undefined)?.trim() || undefined;

    const rendered = render(body.template, body.data ?? {}, appUrl);

    if (body.preview) {
      return new Response(JSON.stringify({ ok: true, preview: true, ...rendered }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!enabled) {
      return new Response(JSON.stringify({ ok: true, skipped: "emails_disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: recipients } = await admin.from("email_recipients").select("email,kind");
    const cc = (recipients ?? []).filter((r) => r.kind === "cc").map((r) => r.email);
    const bcc = (recipients ?? []).filter((r) => r.kind === "bcc").map((r) => r.email);

    const resp = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [body.to],
        cc: cc.length ? cc : undefined,
        bcc: bcc.length ? bcc : undefined,
        reply_to: replyTo,
        subject: rendered.subject,
        html: rendered.html,
      }),
    });

    const result = await resp.json();
    if (!resp.ok) {
      console.error("Resend error", resp.status, result);
      return new Response(JSON.stringify({ ok: false, status: resp.status, error: result }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("send-app-email error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});