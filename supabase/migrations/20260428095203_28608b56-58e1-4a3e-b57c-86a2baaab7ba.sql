-- ============================================================
-- 1. Plan tier enum + subscriptions table
-- ============================================================
do $$ begin
  create type public.plan_tier as enum ('free', 'starter', 'pro');
exception when duplicate_object then null; end $$;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  plan public.plan_tier not null default 'free',
  status text not null default 'active',
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "Users can view their own subscription" on public.subscriptions;
create policy "Users can view their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies on purpose: only edge functions
-- with the service role (Stripe webhook) may mutate billing rows.

create or replace function public.touch_subscriptions_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_subscriptions_updated_at();

-- ============================================================
-- 2. get_user_plan helper (used by RLS, RPCs, edge functions)
-- ============================================================
create or replace function public.get_user_plan(_user_id uuid)
returns public.plan_tier
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select plan
      from public.subscriptions
      where user_id = _user_id
        and status in ('active', 'trialing')
        and (current_period_end is null or current_period_end > now())
      limit 1
    ),
    'free'::public.plan_tier
  );
$$;

-- ============================================================
-- 3. Daily swipe counter
-- ============================================================
create table if not exists public.daily_swipe_counts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  swipe_date date not null default (now() at time zone 'utc')::date,
  count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, swipe_date)
);

alter table public.daily_swipe_counts enable row level security;

drop policy if exists "Users can view their own swipe count" on public.daily_swipe_counts;
create policy "Users can view their own swipe count"
  on public.daily_swipe_counts for select
  using (auth.uid() = user_id);

-- Mutations only via SECURITY DEFINER RPC below.

create or replace function public.increment_daily_swipe(_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  free_limit constant int := 10;
  current_plan public.plan_tier;
  today date := (now() at time zone 'utc')::date;
  new_count int;
begin
  if _user_id is null or _user_id <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  current_plan := public.get_user_plan(_user_id);

  insert into public.daily_swipe_counts (user_id, swipe_date, count)
  values (_user_id, today, 1)
  on conflict (user_id, swipe_date)
  do update set count = public.daily_swipe_counts.count + 1
  returning count into new_count;

  if current_plan = 'free' and new_count > free_limit then
    -- Roll back the increment so a blocked attempt doesn't consume quota
    update public.daily_swipe_counts
      set count = count - 1
      where user_id = _user_id and swipe_date = today;
    raise exception 'DAILY_SWIPE_LIMIT_REACHED'
      using errcode = 'P0001';
  end if;

  return new_count;
end;
$$;

-- ============================================================
-- 4. Wire record_interaction to the limiter
-- ============================================================
create or replace function public.record_interaction(
  p_from_profile_id uuid,
  p_to_profile_id uuid,
  p_interaction_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_user_id uuid;
  v_to_user_id uuid;
begin
  select user_id into v_from_user_id from public.profiles where id = p_from_profile_id;
  select user_id into v_to_user_id   from public.profiles where id = p_to_profile_id;

  if v_from_user_id is null or v_to_user_id is null then
    raise exception 'Record Interaction Error: profile id does not map to an auth user.';
  end if;

  if v_from_user_id <> auth.uid() then
    raise exception 'Not authorized to record interactions for another user';
  end if;

  -- Enforce daily cap (raises DAILY_SWIPE_LIMIT_REACHED for free users at 10/day)
  perform public.increment_daily_swipe(v_from_user_id);

  insert into public.user_interactions (user_id, target_user_id, interaction_type)
  values (v_from_user_id, v_to_user_id, p_interaction_type);
end;
$$;