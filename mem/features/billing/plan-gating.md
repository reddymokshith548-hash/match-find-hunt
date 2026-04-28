---
name: Plan gating rules
description: Server-enforced plan tiers (free/starter/pro), 10/day swipe cap on free, gated features, who-liked-you policy
type: feature
---
## Plans
- `free` (default), `starter` (₹499/mo), `pro` (₹999/6mo). Source of truth: `public.subscriptions` row per user; `public.get_user_plan(uuid)` returns the tier.

## Daily swipe cap
- Free = 10 swipes/day (likes + passes combined). Paid = unlimited.
- Enforced in `public.record_interaction` via `public.increment_daily_swipe()` — DB raises if cap exceeded.
- Hard block on UI: when remaining = 0, swap card actions for an "Upgrade to keep swiping" overlay linking to `/pricing`.

## Paid-only features (Starter + Pro)
- Advanced match filters (stage, role, skills, location). Compatibility-min slider stays free.
- "Who liked you" list — full profiles served by `get-incoming-likes` edge function (SECURITY DEFINER bypass of profile RLS, scoped to liker→viewer pairs only).
- Verified badge, unlimited Spark Rooms, read receipts, typing indicators.

## Pro-only features
- Deep `CompatibilityBreakdown` modal.
- AI match summaries on every profile (cached, 2–3 sentences).
- Priority placement in match queue.

## AI summary widget per plan
- Free: deterministic 1-line trait overlap, no AI call. Shows upgrade CTA.
- Starter: cached 2–3 sentence AI summary from `generate-ai-summary`.
- Pro: opens full `CompatibilityBreakdown` modal.

## Client gate is UX only
- `usePlan` hook drives UI. **All enforcement must also exist server-side** (RLS + edge function checks). Never trust client plan state for access control.