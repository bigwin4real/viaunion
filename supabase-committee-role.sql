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
    where id = auth.uid() and active = true and ((assigned_roles && array['admin', 'steward']::public.portal_role[]) or role in ('admin', 'steward'))
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
    where id = auth.uid() and active = true and ('admin' = any(assigned_roles) or role = 'admin')
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
    where id = auth.uid() and active = true and ('steward' = any(assigned_roles) or role = 'steward')
  );
$$;

drop policy if exists "cases_insert_active" on public.cases;
create policy "cases_insert_active"
on public.cases for insert
with check (public.is_admin_or_steward() and created_by = auth.uid());

drop policy if exists "cases_delete_authorized" on public.cases;
create policy "cases_delete_authorized"
on public.cases for delete
using (public.is_admin());

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

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_date text not null,
  location text not null,
  room text,
  contract text not null default 'Shared',
  note text,
  display_order integer not null default 100,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meetings enable row level security;

drop trigger if exists meetings_touch_updated_at on public.meetings;
create trigger meetings_touch_updated_at
before update on public.meetings
for each row execute function public.touch_updated_at();

drop policy if exists "meetings_public_read" on public.meetings;
create policy "meetings_public_read"
on public.meetings for select
using (true);

drop policy if exists "meetings_admin_steward_manage" on public.meetings;
create policy "meetings_admin_steward_manage"
on public.meetings for all
using (public.is_admin_or_steward())
with check (public.is_admin_or_steward());

create table if not exists public.public_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  contract text not null default 'Shared',
  category text,
  priority text,
  summary text not null,
  display_order integer not null default 100,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.public_executive_team (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  area text,
  contact text,
  note text,
  display_order integer not null default 100,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  requested_role public.portal_role not null default 'steward',
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.public_announcements enable row level security;
alter table public.public_executive_team enable row level security;
alter table public.invite_codes enable row level security;

drop trigger if exists public_announcements_touch_updated_at on public.public_announcements;
create trigger public_announcements_touch_updated_at
before update on public.public_announcements
for each row execute function public.touch_updated_at();

drop trigger if exists public_executive_team_touch_updated_at on public.public_executive_team;
create trigger public_executive_team_touch_updated_at
before update on public.public_executive_team
for each row execute function public.touch_updated_at();

drop policy if exists "public_announcements_read" on public.public_announcements;
create policy "public_announcements_read"
on public.public_announcements for select
using (true);

drop policy if exists "public_announcements_manage" on public.public_announcements;
create policy "public_announcements_manage"
on public.public_announcements for all
using (public.is_admin_or_steward())
with check (public.is_admin_or_steward());

drop policy if exists "public_executive_team_read" on public.public_executive_team;
create policy "public_executive_team_read"
on public.public_executive_team for select
using (true);

drop policy if exists "public_executive_team_manage" on public.public_executive_team;
create policy "public_executive_team_manage"
on public.public_executive_team for all
using (public.is_admin_or_steward())
with check (public.is_admin_or_steward());

drop policy if exists "invite_codes_manage" on public.invite_codes;
create policy "invite_codes_manage"
on public.invite_codes for all
using (public.is_admin_or_steward())
with check (public.is_admin_or_steward());

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
