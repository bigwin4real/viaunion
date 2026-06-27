alter type public.portal_role add value if not exists 'committee';

alter table public.profiles
add column if not exists assigned_roles public.portal_role[] not null default array['steward']::public.portal_role[];

update public.profiles
set assigned_roles = array[role]::public.portal_role[]
where assigned_roles is null or array_length(assigned_roles, 1) is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.portal_role;
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'requested_role' = 'admin' then 'admin'::public.portal_role
    when new.raw_user_meta_data ->> 'requested_role' = 'committee' then 'committee'::public.portal_role
    else 'steward'::public.portal_role
  end;

  insert into public.profiles (id, email, full_name, phone, share_email, share_phone, role, assigned_roles, active, access_status, request_note)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), new.email),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce((new.raw_user_meta_data ->> 'share_email')::boolean, false),
    coalesce((new.raw_user_meta_data ->> 'share_phone')::boolean, false),
    requested_role,
    array[requested_role],
    false,
    'pending',
    nullif(new.raw_user_meta_data ->> 'request_note', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        phone = excluded.phone,
        share_email = excluded.share_email,
        share_phone = excluded.share_phone,
        role = excluded.role,
        assigned_roles = excluded.assigned_roles,
        request_note = excluded.request_note,
        updated_at = now();

  return new;
end;
$$;

create or replace function public.is_admin_or_steward()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active = true and (assigned_roles && array['admin', 'steward']::public.portal_role[])
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active = true and 'admin' = any(assigned_roles)
  );
$$;

create or replace function public.is_steward()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active = true and 'steward' = any(assigned_roles)
  );
$$;

drop policy if exists "cases_insert_active" on public.cases;
create policy "cases_insert_active"
on public.cases for insert
with check (public.is_admin_or_steward() and created_by = auth.uid());

drop policy if exists "resources_select_active" on public.resources;
create policy "resources_select_active"
on public.resources for select
using (
  public.is_admin_or_steward()
  or (
    public.is_active_user()
    and url = 'wages-form.html'
  )
);

drop policy if exists "questions_moderator_manage" on public.public_questions;
create policy "questions_moderator_manage"
on public.public_questions for all
using (public.is_admin_or_steward())
with check (public.is_admin_or_steward());

drop policy if exists "internal_files_select_authorized" on public.internal_files;
create policy "internal_files_select_authorized"
on public.internal_files for select
using (
  public.is_admin_or_steward()
  and (kind = 'general' or public.is_steward())
);

drop policy if exists "internal_files_insert_authorized" on public.internal_files;
create policy "internal_files_insert_authorized"
on public.internal_files for insert
with check (
  public.is_admin_or_steward()
  and uploaded_by = auth.uid()
  and (kind = 'general' or public.is_steward())
);

drop policy if exists "storage_select_authorized_internal_files" on storage.objects;
create policy "storage_select_authorized_internal_files"
on storage.objects for select
using (
  bucket_id = 'internal-files'
  and public.is_admin_or_steward()
  and ((storage.foldername(name))[1] = 'general' or public.is_steward())
);

drop policy if exists "storage_insert_authorized_internal_files" on storage.objects;
create policy "storage_insert_authorized_internal_files"
on storage.objects for insert
with check (
  bucket_id = 'internal-files'
  and public.is_admin_or_steward()
  and ((storage.foldername(name))[1] = 'general' or public.is_steward())
);
