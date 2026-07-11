create type public.portal_role as enum ('admin', 'steward', 'committee', 'election_committee');
create type public.access_status as enum ('pending', 'approved', 'rejected');
create type public.internal_file_kind as enum ('general', 'grievance_tracker');
create type public.case_contract as enum ('Contract 1', 'Contract 2', 'Shared');
create type public.case_status as enum ('Intake', 'Reviewing', 'Filed', 'Waiting on company', 'Meeting scheduled', 'Resolved', 'Withdrawn');
create type public.issue_type as enum ('Grievance', 'Discipline', 'Claim', 'Scheduling', 'Payroll', 'Accommodation', 'Safety', 'Other');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text,
  full_name text not null,
  phone text,
  share_email boolean not null default false,
  share_phone boolean not null default false,
  role public.portal_role not null default 'steward',
  assigned_roles public.portal_role[] not null default array['steward']::public.portal_role[],
  active boolean not null default false,
  access_status public.access_status not null default 'pending',
  request_note text,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_username_unique
on public.profiles (lower(username))
where username is not null and length(trim(username)) > 0;

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  member_name text not null,
  member_contact text,
  contract public.case_contract not null,
  issue_type public.issue_type not null,
  status public.case_status not null default 'Intake',
  assigned_steward_id uuid references public.profiles(id),
  next_deadline date,
  next_action text,
  summary text,
  created_by uuid not null references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.case_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  body text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.case_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  file_size bigint,
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  contract public.case_contract not null default 'Shared',
  description text,
  url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meetings (
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

create table public.public_announcements (
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

create table public.public_executive_team (
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

create table public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  requested_role public.portal_role not null default 'steward',
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.election_contacts (
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

create table public.audit_log (
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

create unique index if not exists resources_title_category_contract_key
on public.resources (title, category, contract);

create table public.public_questions (
  id uuid primary key default gen_random_uuid(),
  name text,
  question text not null,
  answer text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

create table public.public_directory_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  directory_role public.portal_role not null,
  display_name text not null,
  public_title text not null,
  location text,
  contract public.case_contract not null default 'Shared',
  public_contact text,
  is_public boolean not null default true,
  display_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, directory_role)
);

create table public.internal_files (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  kind public.internal_file_kind not null default 'general',
  storage_path text not null unique,
  mime_type text,
  file_size bigint,
  uploaded_by uuid not null references public.profiles(id),
  uploaded_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger cases_touch_updated_at
before update on public.cases
for each row execute function public.touch_updated_at();

create trigger resources_touch_updated_at
before update on public.resources
for each row execute function public.touch_updated_at();

create trigger meetings_touch_updated_at
before update on public.meetings
for each row execute function public.touch_updated_at();

create trigger public_announcements_touch_updated_at
before update on public.public_announcements
for each row execute function public.touch_updated_at();

create trigger public_executive_team_touch_updated_at
before update on public.public_executive_team
for each row execute function public.touch_updated_at();

create trigger election_contacts_touch_updated_at
before update on public.election_contacts
for each row execute function public.touch_updated_at();

create trigger public_directory_entries_touch_updated_at
before update on public.public_directory_entries
for each row execute function public.touch_updated_at();

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
    select 1 from public.profiles
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
    select 1 from public.profiles
    where id = auth.uid() and active = true and ('admin' = any(assigned_roles) or role = 'admin')
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

create or replace function public.admin_delete_user(
  target_profile_id uuid default null,
  target_email text default null,
  target_username text default null
)
returns table (
  deleted_profile_id uuid,
  deleted_email text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_profile public.profiles%rowtype;
  actor_id uuid := auth.uid();
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

  if target_profile.id = actor_id then
    raise exception 'You cannot delete your own account here.' using errcode = '42501';
  end if;

  update public.profiles set approved_by = null where approved_by = target_profile.id;
  update public.cases
    set assigned_steward_id = case when assigned_steward_id = target_profile.id then null else assigned_steward_id end,
        created_by = case when created_by = target_profile.id then actor_id else created_by end,
        updated_by = case when updated_by = target_profile.id then actor_id else updated_by end
    where assigned_steward_id = target_profile.id or created_by = target_profile.id or updated_by = target_profile.id;
  update public.case_notes set created_by = actor_id where created_by = target_profile.id;
  update public.case_documents set uploaded_by = actor_id where uploaded_by = target_profile.id;
  update public.resources set created_by = null where created_by = target_profile.id;
  update public.meetings
    set created_by = case when created_by = target_profile.id then null else created_by end,
        updated_by = case when updated_by = target_profile.id then null else updated_by end
    where created_by = target_profile.id or updated_by = target_profile.id;
  update public.public_announcements
    set created_by = case when created_by = target_profile.id then null else created_by end,
        updated_by = case when updated_by = target_profile.id then null else updated_by end
    where created_by = target_profile.id or updated_by = target_profile.id;
  update public.public_executive_team
    set created_by = case when created_by = target_profile.id then null else created_by end,
        updated_by = case when updated_by = target_profile.id then null else updated_by end
    where created_by = target_profile.id or updated_by = target_profile.id;
  update public.election_contacts
    set created_by = case when created_by = target_profile.id then null else created_by end,
        updated_by = case when updated_by = target_profile.id then null else updated_by end
    where created_by = target_profile.id or updated_by = target_profile.id;
  update public.internal_files set uploaded_by = actor_id where uploaded_by = target_profile.id;
  update public.audit_log set actor_id = null where actor_id = target_profile.id;
  delete from public.public_directory_entries where profile_id = target_profile.id;

  delete from auth.users
  where id = target_profile.id
     or lower(email) = lower(target_profile.email);
  delete from public.profiles where id = target_profile.id;

  return query select target_profile.id, target_profile.email;
end;
$$;

grant execute on function public.admin_delete_user(uuid, text, text) to authenticated;

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

create or replace function public.is_public_profile(profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where profiles.id = profile_id
      and profiles.active
      and profiles.access_status = 'approved'
  );
$$;

create or replace function public.can_access_case(case_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin() or exists (
    select 1 from public.cases
    where id = case_id
      and (created_by = auth.uid() or assigned_steward_id = auth.uid())
  );
$$;

alter table public.profiles enable row level security;
alter table public.cases enable row level security;
alter table public.case_notes enable row level security;
alter table public.case_documents enable row level security;
alter table public.resources enable row level security;
alter table public.meetings enable row level security;
alter table public.public_announcements enable row level security;
alter table public.public_executive_team enable row level security;
alter table public.invite_codes enable row level security;
alter table public.election_contacts enable row level security;
alter table public.audit_log enable row level security;
alter table public.public_questions enable row level security;
alter table public.public_directory_entries enable row level security;
alter table public.internal_files enable row level security;

create policy "profiles_select_self_or_admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "profiles_admin_manage"
on public.profiles for all
using (public.is_admin())
with check (public.is_admin());

create policy "cases_select_authorized"
on public.cases for select
using (public.can_access_case(id));

create policy "cases_insert_active"
on public.cases for insert
with check (public.is_admin_or_steward() and created_by = auth.uid());

create policy "cases_update_authorized"
on public.cases for update
using (public.can_access_case(id))
with check (public.can_access_case(id));

create policy "cases_delete_authorized"
on public.cases for delete
using (public.is_admin());

create policy "notes_select_authorized"
on public.case_notes for select
using (public.can_access_case(case_id));

create policy "notes_insert_authorized"
on public.case_notes for insert
with check (public.can_access_case(case_id) and created_by = auth.uid());

create policy "documents_select_authorized"
on public.case_documents for select
using (public.can_access_case(case_id));

create policy "documents_insert_authorized"
on public.case_documents for insert
with check (public.can_access_case(case_id) and uploaded_by = auth.uid());

create policy "resources_select_active"
on public.resources for select
using (
  public.is_admin_or_steward()
  or (
    public.is_active_user()
    and url = 'wages-form.html'
  )
);

create policy "resources_admin_manage"
on public.resources for all
using (public.is_admin())
with check (public.is_admin());

create policy "meetings_public_read"
on public.meetings for select
using (true);

create policy "meetings_admin_steward_manage"
on public.meetings for all
using (public.is_admin_or_steward())
with check (public.is_admin_or_steward());

create policy "public_announcements_read"
on public.public_announcements for select
using (true);

create policy "public_announcements_manage"
on public.public_announcements for all
using (public.is_admin_or_steward())
with check (public.is_admin_or_steward());

create policy "public_executive_team_read"
on public.public_executive_team for select
using (true);

create policy "public_executive_team_manage"
on public.public_executive_team for all
using (public.is_admin_or_steward())
with check (public.is_admin_or_steward());

create policy "invite_codes_manage"
on public.invite_codes for all
using (public.is_admin_or_steward())
with check (public.is_admin_or_steward());

create policy "election_contacts_authorized"
on public.election_contacts for all
using (
  public.is_admin()
  or public.is_steward()
  or exists (
    select 1 from public.profiles
    where id = auth.uid()
      and active = true
      and ('election_committee' = any(assigned_roles) or role = 'election_committee')
  )
)
with check (
  public.is_admin()
  or public.is_steward()
  or exists (
    select 1 from public.profiles
    where id = auth.uid()
      and active = true
      and ('election_committee' = any(assigned_roles) or role = 'election_committee')
  )
);

create policy "audit_log_admin_read"
on public.audit_log for select
using (public.is_admin());

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

create policy "questions_public_answered"
on public.public_questions for select
using (status = 'answered');

create policy "questions_public_insert"
on public.public_questions for insert
with check (status = 'pending');

create policy "questions_moderator_manage"
on public.public_questions for all
using (public.is_admin_or_steward())
with check (public.is_admin_or_steward());

create policy "public_directory_select_public"
on public.public_directory_entries for select
using (is_public and public.is_public_profile(profile_id));

create policy "public_directory_admin_manage"
on public.public_directory_entries for all
using (public.is_admin())
with check (public.is_admin());

create policy "internal_files_select_authorized"
on public.internal_files for select
using (
  public.is_admin_or_steward()
  and (kind = 'general' or public.is_steward())
);

create policy "internal_files_insert_authorized"
on public.internal_files for insert
with check (
  public.is_admin_or_steward()
  and uploaded_by = auth.uid()
  and (kind = 'general' or public.is_steward())
);

insert into storage.buckets (id, name, public)
values ('steward-documents', 'steward-documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('internal-files', 'internal-files', false)
on conflict (id) do nothing;

create policy "storage_select_authorized_case_docs"
on storage.objects for select
using (
  bucket_id = 'steward-documents'
  and public.can_access_case((storage.foldername(name))[1]::uuid)
);

create policy "storage_insert_authorized_case_docs"
on storage.objects for insert
with check (
  bucket_id = 'steward-documents'
  and public.can_access_case((storage.foldername(name))[1]::uuid)
);

create policy "storage_select_authorized_internal_files"
on storage.objects for select
using (
  bucket_id = 'internal-files'
  and public.is_admin_or_steward()
  and ((storage.foldername(name))[1] = 'general' or public.is_steward())
);

create policy "storage_insert_authorized_internal_files"
on storage.objects for insert
with check (
  bucket_id = 'internal-files'
  and public.is_admin_or_steward()
  and ((storage.foldername(name))[1] = 'general' or public.is_steward())
);

insert into public.resources (title, category, contract, description, url)
values
  ('Collective Agreements', 'Agreements', 'Shared', 'Protected reference copies for Contract 1 and Contract 2.', null),
  ('Grievance Template', 'Templates', 'Shared', 'Standard grievance filing checklist and wording starter.', null),
  ('Claims and Payroll Guide', 'Guides', 'Shared', 'Common claim paths, evidence checklist, and follow-up notes.', null),
  ('Moncton Steward Contacts', 'Contacts', 'Shared', 'Internal steward and committee contact reference.', null),
  ('Health and Safety Notes', 'Committees', 'Shared', 'Committee notes, inspection references, and escalation paths.', null),
  ('Meeting Minutes', 'Meetings', 'Shared', 'Protected meeting records and action items.', null),
  ('Lost time / expense form', 'Forms', 'Shared', 'Steward/admin form for Unifor wages, lost time, and expense claims.', 'wages-form.html')
on conflict (title, category, contract) do update
set description = excluded.description,
    url = excluded.url,
    updated_at = now();
