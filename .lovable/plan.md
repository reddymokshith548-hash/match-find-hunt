# Match & Message Email Notifications

Send branded Lexach emails (via existing Resend setup) when a user gets a new co-founder match or a new chat message — without spamming.

## What gets sent

1. **New Match email** — when a row is inserted into `matches`. Both users receive a branded email: "You have a new co-founder match on Lexach" with the other user's name + match score and a CTA to `lexach.vercel.app/dashboard`.
2. **New Message email** — when a row is inserted into `messages`. The receiver gets "{Sender} sent you a message on Lexach" with a snippet (first ~120 chars, sanitized) and a CTA to `lexach.vercel.app/messages`.

Both reuse the existing branded `baseLayout` already used for plan/role emails so styling stays consistent.

## Anti-spam / quality rules

- **Per-user preferences**: new table `notification_preferences` (one row per user, defaults on) with toggles `email_new_match` and `email_new_message`. Users can flip them in `/settings`.
- **Cooldown for messages**: only send a message email if the receiver has had no email for that conversation in the last 30 minutes (avoids one-email-per-line during active chat). Tracked in a small `email_send_log` table (`user_id, kind, ref_id, sent_at`).
- **Skip if recipient is online**: if `profiles.last_active` is within the last 2 minutes for a message email, skip (they're already in the app).
- **Match score floor**: only send match emails for matches with `final_score >= 60` (or `match_score` if final is null) to avoid noisy low-quality alerts.
- **No self-emails** and no emails when the global `email_settings.enabled` is false.

## Technical plan

### 1. Database (one migration)

- Create `public.notification_preferences`:
  - `user_id uuid PK references auth.users on delete cascade`
  - `email_new_match boolean not null default true`
  - `email_new_message boolean not null default true`
  - `updated_at timestamptz default now()`
  - RLS: owner can `select`/`insert`/`update` own row.
- Create `public.email_send_log`:
  - `id bigserial PK, user_id uuid, kind text, ref_id uuid, sent_at timestamptz default now()`
  - Index on `(user_id, kind, ref_id, sent_at desc)`.
  - RLS: only service role reads/writes (no client policies).

### 2. New edge function: `send-notification-email`

Public (verify_jwt = false) — invoked from DB triggers via `pg_net` with the service role key, and idempotent.

Body: `{ kind: "new_match" | "new_message", recipient_user_id, payload: {...} }`.

Logic:
- Load `email_settings` (reuse existing row); abort if `enabled = false`.
- Load recipient's `auth.users.email`, `profiles.name`, `profiles.last_active`, and `notification_preferences`.
- Apply the rules above (pref off, online, cooldown, score floor) → return `{skipped: reason}`.
- Render with new templates `new_match` and `new_message` reusing `baseLayout`.
- Send through the existing Resend gateway with the verified `noreply@…` sender.
- Insert into `email_send_log`.

### 3. DB triggers (in same migration)

- `AFTER INSERT ON public.matches` → for each side, call `net.http_post` to `send-notification-email` with `kind=new_match`.
- `AFTER INSERT ON public.messages` → call it for `receiver_id` with `kind=new_message` and a sanitized snippet.

Triggers use `SECURITY DEFINER` and read the function URL + service role key from a small `app_settings` row (or hardcode the project URL — already known).

### 4. Frontend

- Add a **Notifications** section to `src/pages/Settings.tsx` with two switches bound to `notification_preferences` (auto-create row on first load).
- Add to `/admin/settings` a "Send test" picker for the two new templates so admins can preview.
- Extend `email-templates` preview list in `AdminSettings.tsx` to include `new_match` and `new_message`.

### 5. Files touched

```text
supabase/migrations/<new>.sql                        (new: tables, RLS, triggers)
supabase/functions/send-notification-email/index.ts  (new)
src/pages/Settings.tsx                               (add notification toggles)
src/pages/AdminSettings.tsx                          (add 2 new test templates)
src/lib/adminEmail.ts                                (extend template union)
src/integrations/supabase/types.ts                   (auto-regenerated)
```

No changes needed to the existing `send-app-email` function or to admin/plans/roles flows.

## Out of scope

- In-app push/web-push notifications (separate system).
- Digest/daily-summary emails (would be marketing-style, not 1:1 transactional).
- Editing the unsubscribe footer — Resend handles list-unsubscribe headers; we'll add a simple "Manage notifications" link to `/settings` in each email body.
