-- Create Storage buckets for chat attachments and NDA signatures
-- (private buckets; access controlled via RLS policies on storage.objects)

-- Buckets
insert into storage.buckets (id, name, public)
values
  ('chat-media', 'chat-media', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values
  ('nda-signatures', 'nda-signatures', false)
on conflict (id) do nothing;

-- Helper: safely extract connection_id from a storage object path like:
-- connections/<connection_uuid>/images/<file>
create or replace function public.extract_connection_id_from_storage_path(_name text)
returns uuid
language plpgsql
stable
security definer
set search_path = public, storage
as $$
declare
  parts text[];
  cid uuid;
begin
  parts := storage.foldername(_name);

  if parts is null or array_length(parts, 1) < 2 then
    return null;
  end if;

  if parts[1] <> 'connections' then
    return null;
  end if;

  begin
    cid := parts[2]::uuid;
  exception when others then
    return null;
  end;

  return cid;
end;
$$;

-- Helper: can the current user access a given connection?
-- Uses profile IDs stored in connections.user1_id/user2_id.
create or replace function public.can_access_connection(_connection_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.connections c
    where c.id = _connection_id
      and (
        c.user1_id = public.get_my_profile_id()
        or c.user2_id = public.get_my_profile_id()
      )
      and c.status = 'accepted'
      and coalesce(c.nda_signed_by_user1, false) = true
      and coalesce(c.nda_signed_by_user2, false) = true
  );
$$;

-- Storage policies: chat-media (attachments + voice notes)
-- Objects must be stored under: connections/<connection_uuid>/...

drop policy if exists "Chat media: participants can read" on storage.objects;
drop policy if exists "Chat media: participants can upload" on storage.objects;
drop policy if exists "Chat media: participants can update" on storage.objects;
drop policy if exists "Chat media: participants can delete" on storage.objects;

create policy "Chat media: participants can read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'chat-media'
  and public.can_access_connection(public.extract_connection_id_from_storage_path(name))
);

create policy "Chat media: participants can upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'chat-media'
  and public.extract_connection_id_from_storage_path(name) is not null
  and public.can_access_connection(public.extract_connection_id_from_storage_path(name))
);

create policy "Chat media: participants can update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'chat-media'
  and public.can_access_connection(public.extract_connection_id_from_storage_path(name))
)
with check (
  bucket_id = 'chat-media'
  and public.can_access_connection(public.extract_connection_id_from_storage_path(name))
);

create policy "Chat media: participants can delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'chat-media'
  and public.can_access_connection(public.extract_connection_id_from_storage_path(name))
);

-- Storage policies: nda-signatures (owner-only)
-- Objects must be stored under: <auth.uid()>/<file>

drop policy if exists "NDA signatures: owner can read" on storage.objects;
drop policy if exists "NDA signatures: owner can upload" on storage.objects;
drop policy if exists "NDA signatures: owner can update" on storage.objects;
drop policy if exists "NDA signatures: owner can delete" on storage.objects;

create policy "NDA signatures: owner can read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'nda-signatures'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "NDA signatures: owner can upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'nda-signatures'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "NDA signatures: owner can update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'nda-signatures'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'nda-signatures'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "NDA signatures: owner can delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'nda-signatures'
  and auth.uid()::text = (storage.foldername(name))[1]
);
