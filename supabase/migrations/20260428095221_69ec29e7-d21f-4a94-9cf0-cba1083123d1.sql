-- Restrict newly added SECURITY DEFINER helpers to authenticated users only
revoke all on function public.get_user_plan(uuid) from public, anon;
grant execute on function public.get_user_plan(uuid) to authenticated, service_role;

revoke all on function public.increment_daily_swipe(uuid) from public, anon;
grant execute on function public.increment_daily_swipe(uuid) to authenticated, service_role;

revoke all on function public.touch_subscriptions_updated_at() from public, anon;