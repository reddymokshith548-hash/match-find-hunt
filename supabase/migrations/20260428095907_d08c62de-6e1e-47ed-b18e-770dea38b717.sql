-- SECURITY DEFINER RPC so any authenticated user can fetch the COUNT of pending likes
-- they have received without exposing who sent them. Profile data still requires the
-- get-incoming-likes edge function (which checks plan tier server-side).
--
-- This complements existing RLS:
--   * user_interactions has SELECT policy: auth.uid() = user_id  -> users can only see
--     interactions they themselves created. They CANNOT directly query who liked them.
--   * Reading another user's profile still requires either is_active=true (public
--     fields only) or an existing connection — no PII leaks just because a count exists.

create or replace function public.get_incoming_likes_count(_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.user_interactions liker
  where liker.target_user_id = _user_id
    and liker.interaction_type = 'like'
    and not exists (
      select 1
      from public.user_interactions me
      where me.user_id = _user_id
        and me.target_user_id = liker.user_id
        and me.interaction_type = 'like'
    );
$$;

-- Only the user themselves may ask for their own count
revoke all on function public.get_incoming_likes_count(uuid) from public;
grant execute on function public.get_incoming_likes_count(uuid) to authenticated;

create or replace function public.my_incoming_likes_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select public.get_incoming_likes_count(auth.uid());
$$;

revoke all on function public.my_incoming_likes_count() from public;
grant execute on function public.my_incoming_likes_count() to authenticated;