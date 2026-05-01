# Set up lexach.com as the verified email sender

## Goal
Move admin notification emails (Pro upgrade, role granted, role revoked) from the Resend test sender (`onboarding@resend.dev`) to your own verified domain `noreply@lexach.com`, with proper SPF, DKIM, and DMARC records so messages land in inboxes (not spam).

## What you'll do (in your hosting/registrar dashboard)

1. **Add the domain in Resend**
   - Go to Resend → Domains → Add Domain → enter `lexach.com` (or a subdomain like `mail.lexach.com` if you want to keep the root domain free for other email).
   - Resend will display a list of DNS records to add (typically 1 MX, 1 SPF TXT, 1 DKIM TXT, optionally DMARC).

2. **Add those records at your hosting/registrar's DNS panel**
   - Copy each record from Resend and paste exactly as shown (Type, Name/Host, Value).
   - Common gotchas: don't append your domain to the "Name" field if the panel does it automatically; TXT values must be the full string including quotes if the provider strips them.

3. **Wait for verification**
   - Resend re-checks every few minutes. Most providers verify within 5–30 min; full DNS propagation can take up to 24h.
   - Once Resend shows "Verified", we can switch the sender.

## What I'll do in the app (after verification)

1. **Update default sender** in the `email_settings` table:
   - `from_email` → `noreply@lexach.com` (or your chosen address)
   - `from_name` → `Lexach`
2. **Confirm in `/admin/settings`** that the new From address is active and send a test by toggling a test user Free → Pro.
3. **Optional polish**:
   - Add a `Reply-To` field in settings (so users replying go to e.g. `hello@lexach.com`).
   - Add a "Send test email" button on the settings page that fires any of the 3 templates to your own email for verification.

## Decision needed from you

- **Subdomain vs root**: Do you want emails from:
  - `noreply@lexach.com` (root) — cleanest, but locks the root MX to Resend if you ever want a mailbox there.
  - `noreply@mail.lexach.com` (subdomain, recommended) — keeps `lexach.com` free for a real mailbox/Google Workspace later.

## Technical details

- Records Resend will ask for (typical):
  ```text
  MX   send.lexach.com           feedback-smtp.<region>.amazonses.com   priority 10
  TXT  send.lexach.com           "v=spf1 include:amazonses.com ~all"
  TXT  resend._domainkey.lexach.com   "p=<dkim-public-key>"
  TXT  _dmarc.lexach.com         "v=DMARC1; p=none;"   (optional but recommended)
  ```
- After verification, the existing `send-app-email` edge function needs no code changes — it already reads `from_email` from `email_settings` at runtime.
- We'll keep `onboarding@resend.dev` as a documented fallback in case verification breaks later.

## Out of scope
- Setting up an inbox to *receive* mail at lexach.com (that needs Google Workspace / Zoho / etc., separate from Resend sending).
- Marketing/bulk emails (Resend can do them, but we're keeping admin emails strictly transactional).

Reply with:
1. Which sender address you want (root or subdomain), and
2. The name of your hosting provider (Hostinger, GoDaddy, Namecheap, Cloudflare, etc.) — I'll give you exact step-by-step DNS instructions for that panel.
