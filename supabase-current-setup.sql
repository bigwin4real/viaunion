-- Apply this to an existing Supabase project that already has auth enabled.
-- Safe to run more than once.

alter type public.portal_role add value if not exists 'committee';
alter type public.portal_role add value if not exists 'election_committee';

alter table public.profiles
add column if not exists assigned_roles public.portal_role[] not null default array['steward']::public.portal_role[];

alter table public.profiles
add column if not exists username text;

create unique index if not exists profiles_username_unique
on public.profiles (lower(username))
where username is not null and length(trim(username)) > 0;

update public.profiles
set assigned_roles = array[role]::public.portal_role[]
where assigned_roles is null or array_length(assigned_roles, 1) is null;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.portal_role;
  invite_role public.portal_role;
  invite_code text;
  is_invited boolean := false;
begin
  invite_code := nullif(new.raw_user_meta_data ->> 'invite_code', '');
  if invite_code is not null then
    select requested_role
      into invite_role
    from public.invite_codes
    where code = invite_code;
    is_invited := invite_role is not null;
  end if;

  requested_role := case
    when is_invited then invite_role
    when new.raw_user_meta_data ->> 'requested_role' = 'admin' then 'admin'::public.portal_role
    when new.raw_user_meta_data ->> 'requested_role' = 'committee' then 'committee'::public.portal_role
    when new.raw_user_meta_data ->> 'requested_role' = 'election_committee' then 'election_committee'::public.portal_role
    else 'steward'::public.portal_role
  end;

  insert into public.profiles (id, email, username, full_name, phone, share_email, share_phone, role, assigned_roles, active, access_status, request_note)
  values (
    new.id,
    new.email,
    nullif(lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', ''), '[^a-z0-9._-]+', '-', 'g')), ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), new.email),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce((new.raw_user_meta_data ->> 'share_email')::boolean, false),
    coalesce((new.raw_user_meta_data ->> 'share_phone')::boolean, false),
    requested_role,
    array[requested_role],
    is_invited,
    case when is_invited then 'approved'::public.access_status else 'pending'::public.access_status end,
    nullif(new.raw_user_meta_data ->> 'request_note', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        username = coalesce(excluded.username, public.profiles.username),
        full_name = excluded.full_name,
        phone = excluded.phone,
        share_email = excluded.share_email,
        share_phone = excluded.share_phone,
        role = excluded.role,
        assigned_roles = excluded.assigned_roles,
        active = excluded.active,
        access_status = excluded.access_status,
        request_note = excluded.request_note,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_active_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and active = true
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
    select 1
    from public.profiles
    where id = auth.uid()
      and active = true
      and ('admin' = any(assigned_roles) or role = 'admin')
  );
$$;

create or replace function public.admin_repair_user_access(
  target_profile_id uuid default null,
  target_email text default null,
  target_username text default null
)
returns table (
  repaired_profile_id uuid,
  repaired_auth_id uuid,
  repaired_email text,
  email_confirmed_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_profile public.profiles%rowtype;
  repaired_user auth.users%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  select *
    into target_profile
  from public.profiles
  where (target_profile_id is not null and id = target_profile_id)
     or (nullif(target_email, '') is not null and lower(email) = lower(target_email))
     or (nullif(target_username, '') is not null and username = target_username)
  order by
    case when target_profile_id is not null and id = target_profile_id then 0 else 1 end,
    created_at desc
  limit 1;

  if target_profile.id is null then
    raise exception 'Target profile was not found.' using errcode = 'P0002';
  end if;

  update auth.users
  set email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
      updated_at = now(),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
        'full_name', coalesce(target_profile.full_name, target_profile.email, ''),
        'username', coalesce(target_profile.username, ''),
        'requested_role', coalesce(target_profile.role::text, 'committee'),
        'phone', target_profile.phone,
        'share_email', target_profile.share_email,
        'share_phone', target_profile.share_phone
      )
  where id = target_profile.id
     or lower(email) = lower(target_profile.email)
  returning * into repaired_user;

  if repaired_user.id is null then
    raise exception 'Auth user was not found for this profile.' using errcode = 'P0002';
  end if;

  update public.profiles
  set active = true,
      access_status = 'approved',
      approved_by = auth.uid(),
      approved_at = coalesce(approved_at, now()),
      updated_at = now()
  where id = target_profile.id;

  return query
  select
    target_profile.id,
    repaired_user.id,
    repaired_user.email::text,
    repaired_user.email_confirmed_at;
end;
$$;

grant execute on function public.admin_repair_user_access(uuid, text, text) to authenticated;

create or replace function public.is_steward()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and active = true
      and ('steward' = any(assigned_roles) or role = 'steward')
  );
$$;

create or replace function public.is_admin_or_steward()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and active = true
      and ((assigned_roles && array['admin', 'steward']::public.portal_role[]) or role in ('admin', 'steward'))
  );
$$;

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

create table if not exists public.election_contacts (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  group_name text,
  election_date date,
  member_name text not null,
  email text,
  note text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text,
  action_kind text not null,
  target_type text not null,
  target_id text,
  target_label text,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.meetings enable row level security;
alter table public.public_announcements enable row level security;
alter table public.public_executive_team enable row level security;
alter table public.invite_codes enable row level security;
alter table public.election_contacts enable row level security;
alter table public.audit_log enable row level security;

drop trigger if exists meetings_touch_updated_at on public.meetings;
create trigger meetings_touch_updated_at
before update on public.meetings
for each row execute function public.touch_updated_at();

drop trigger if exists public_announcements_touch_updated_at on public.public_announcements;
create trigger public_announcements_touch_updated_at
before update on public.public_announcements
for each row execute function public.touch_updated_at();

drop trigger if exists public_executive_team_touch_updated_at on public.public_executive_team;
create trigger public_executive_team_touch_updated_at
before update on public.public_executive_team
for each row execute function public.touch_updated_at();

drop trigger if exists election_contacts_touch_updated_at on public.election_contacts;
create trigger election_contacts_touch_updated_at
before update on public.election_contacts
for each row execute function public.touch_updated_at();

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

drop policy if exists "meetings_public_read" on public.meetings;
create policy "meetings_public_read"
on public.meetings for select
using (true);

drop policy if exists "meetings_admin_steward_manage" on public.meetings;
create policy "meetings_admin_steward_manage"
on public.meetings for all
using (public.is_admin_or_steward())
with check (public.is_admin_or_steward());

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

drop policy if exists "election_contacts_authorized" on public.election_contacts;
create policy "election_contacts_authorized"
on public.election_contacts for all
using (
  public.is_admin()
  or public.is_steward()
  or exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and active = true
      and ('election_committee' = any(assigned_roles) or role = 'election_committee')
  )
)
with check (
  public.is_admin()
  or public.is_steward()
  or exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and active = true
      and ('election_committee' = any(assigned_roles) or role = 'election_committee')
  )
);

drop policy if exists "audit_log_admin_read" on public.audit_log;
create policy "audit_log_admin_read"
on public.audit_log for select
using (public.is_admin());

drop policy if exists "audit_log_authorized_insert" on public.audit_log;
create policy "audit_log_authorized_insert"
on public.audit_log for insert
with check (
  auth.uid() is not null
  and actor_id = auth.uid()
  and exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and active = true
  )
);

notify pgrst, 'reload schema';
