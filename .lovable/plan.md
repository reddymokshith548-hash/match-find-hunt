## Goal

Swap the current Stripe stub for a working **Razorpay** checkout on `/pricing`. Zero setup fees, ~2% per successful transaction. Test mode works immediately; going live only needs the user to paste live keys later.

## What changes

### 1. Secrets
Request two secrets (Razorpay Dashboard → Settings → API Keys, "Generate Test Keys"):
- `RAZORPAY_KEY_ID` (starts with `rzp_test_` or `rzp_live_`)
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET` (created later in Dashboard → Webhooks; used to verify activation callbacks)

### 2. Database migration
Add a `payment_orders` table to track Razorpay orders → user → plan mapping so the webhook can activate the right subscription:

- `id` (uuid), `user_id`, `razorpay_order_id` (unique), `razorpay_payment_id`, `plan` (starter | pro), `cycle` (monthly | halfyear), `amount_paise` (int), `status` (created | paid | failed), timestamps.
- RLS: user can read their own orders; service_role full access (webhook writes).

### 3. Edge functions

**`create-razorpay-order`** (replaces the Stripe stub the button calls)
- Auth: verify JWT, get user id + email.
- Input: `{ plan: "starter" | "pro", cycle: "monthly" | "halfyear" }`.
- Server-side price map (same as today): 499 / 990 / 2990 INR → paise.
- Calls Razorpay `POST /v1/orders` with amount, currency `INR`, receipt, and notes (`user_id`, `plan`, `cycle`).
- Inserts a row in `payment_orders` with `status='created'`.
- Returns `{ order_id, amount, currency, key_id, name, description, prefill: { email } }` to the frontend.

**`razorpay-webhook`** (public, no JWT — Razorpay calls it)
- Verifies `X-Razorpay-Signature` HMAC-SHA256 using `RAZORPAY_WEBHOOK_SECRET`.
- On `payment.captured` (and `order.paid`): look up `payment_orders` by `razorpay_order_id`, mark `paid`, then upsert `subscriptions` for that user: `plan='pro'|'starter'`, `status='active'`, `current_period_end = now() + interval` (1 month for monthly, 6 months for halfyear).
- On `payment.failed`: mark order `failed`. No subscription change.
- Idempotent (safe to re-deliver).

Both use CORS headers. `verify_jwt = false` set for the webhook in `supabase/config.toml`.

### 4. Frontend

**`src/hooks/useCheckout.tsx`** (rewrite)
- On click: call `create-razorpay-order` → receive order details.
- Dynamically inject `https://checkout.razorpay.com/v1/checkout.js` once.
- Open Razorpay Checkout modal with the returned options + a `handler` that navigates to `/dashboard?checkout=success&plan=…` (the webhook does the real activation — this is just UX).
- `ondismiss` → navigate to `/pricing?checkout=cancelled`.

**`src/pages/Pricing.tsx`** — no visible copy changes needed beyond removing any "Stripe" mentions; the button flow is identical.

### 5. Cleanup
- Leave `supabase/functions/create-checkout/` in place but unused (or delete it — user's call). Recommendation: delete to avoid confusion.
- Update the FAQ line "Payments coming soon — Stripe" wording to just "Secure payments via Razorpay (UPI, cards, netbanking, wallets)".

## Webhook URL to paste in Razorpay Dashboard

`https://vagrjonewjbjeuotsrya.supabase.co/functions/v1/razorpay-webhook`

Subscribed events: `payment.captured`, `payment.failed`, `order.paid`.

## Notes / non-goals

- **One-time payments only** for now — the 6-month plan is a single ₹2,990 charge; the 1-month plans will also charge once and require the user to re-pay next month. True auto-renewing subscriptions (Razorpay Subscriptions + e-mandate) is a bigger add-on we can layer on later.
- Live payments require the user to complete Razorpay KYC (PAN + bank account for individual) and swap test keys for live keys. No code changes needed at that point.
- I'll ask for the API keys via the secure secret form only after you approve this plan.
