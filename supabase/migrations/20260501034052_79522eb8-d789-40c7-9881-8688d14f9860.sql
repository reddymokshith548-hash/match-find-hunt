
-- Notification preferences
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_new_match boolean not null default true,
  email_new_message boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "Users view own notification prefs"
  on public.notification_preferences for select
  to authenticated using (auth.uid() = user_id);

create policy "Users insert own notification prefs"
  on public.notification_preferences for insert
  to authenticated with check (auth.uid() = user_id);

create policy "Users update own notification prefs"
  on public.notification_preferences for update
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Email send log (cooldown / audit). Service role only.
create table if not exists public.email_send_log (
  id bigserial primary key,
  user_id uuid not null,
  kind text not null,
  ref_id uuid,
  sent_at timestamptz not null default now()
);

create index if not exists email_send_log_user_kind_ref_idx
  on public.email_send_log (user_id, kind, ref_id, sent_at desc);

alter table public.email_send_log enable row level security;
-- No policies => only service role can read/write.

-- Enable pg_net for HTTP calls from triggers
create extension if not exists pg_net with schema extensions;

-- Helper: invoke the notification email edge function via pg_net.
-- Uses anon key + a shared secret header verified inside the function.
create or replace function public.invoke_notification_email(
  _kind text,
  _recipient_user_id uuid,
  _payload jsonb
) returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  fn_url text := 'https://vagrjonewjbjeuotsrya.supabase.co/functions/v1/send-notification-email';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhZ3Jqb25ld2piamV1b3RzcnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4ODA0MzgsImV4cCI6MjA3MjQ1NjQzOH0.I8yQhk7JSSol3EeVtMs2ZmVVj3Y1TndyLNUsjHf8H-0';
begin
  perform extensions.net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key,
      'x-internal-trigger', 'lexach-db-trigger'
    ),
    body := jsonb_build_object(
      'kind', _kind,
      'recipient_user_id', _recipient_user_id,
      'payload', _payload
    )
  );
exception when others then
  raise warning 'invoke_notification_email failed: %', sqlerrm;
end;
$$;

-- Trigger: new match -> notify both users (matches.user1_id/user2_id are auth user ids)
create or replace function public.notify_new_match_emails()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  score int := coalesce(new.final_score, new.match_score, 0);
begin
  if new.user1_id is not null and new.user1_id is distinct from new.user2_id then
    perform public.invoke_notification_email(
      'new_match',
      new.user1_id,
      jsonb_build_object('match_id', new.id, 'other_user_id', new.user2_id, 'score', score)
    );
  end if;
  if new.user2_id is not null and new.user1_id is distinct from new.user2_id then
    perform public.invoke_notification_email(
      'new_match',
      new.user2_id,
      jsonb_build_object('match_id', new.id, 'other_user_id', new.user1_id, 'score', score)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_new_match_emails on public.matches;
create trigger trg_notify_new_match_emails
after insert on public.matches
for each row execute function public.notify_new_match_emails();

-- Trigger: new message -> notify receiver.
-- messages.sender_id / receiver_id are PROFILE ids, not auth user ids.
create or replace function public.notify_new_message_emails()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  receiver_auth uuid;
  sender_auth uuid;
  snippet text;
begin
  select user_id into receiver_auth from public.profiles where id = new.receiver_id;
  select user_id into sender_auth   from public.profiles where id = new.sender_id;

  if receiver_auth is null then
    return new;
  end if;

  snippet := case
    when new.message_type is not null and new.message_type <> 'text'
      then '[' || new.message_type || ']'
    else left(coalesce(new.content, ''), 140)
  end;

  perform public.invoke_notification_email(
    'new_message',
    receiver_auth,
    jsonb_build_object(
      'message_id', new.id,
      'connection_id', new.connection_id,
      'sender_user_id', sender_auth,
      'snippet', snippet
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_new_message_emails on public.messages;
create trigger trg_notify_new_message_emails
after insert on public.messages
for each row execute function public.notify_new_message_emails();
