create type public.portal_role as enum ('admin', 'steward');
create type public.access_status as enum ('pending', 'approved', 'rejected');
create type public.internal_file_kind as enum ('general', 'grievance_tracker');
create type public.case_contract as enum ('Contract 1', 'Contract 2', 'Shared');
create type public.case_status as enum ('Intake', 'Reviewing', 'Filed', 'Waiting on company', 'Meeting scheduled', 'Resolved', 'Withdrawn');
create type public.issue_type as enum ('Grievance', 'Discipline', 'Claim', 'Scheduling', 'Payroll', 'Accommodation', 'Safety', 'Other');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null,
  phone text,
  share_email boolean not null default false,
  share_phone boolean not null default false,
  role public.portal_role not null default 'steward',
  active boolean not null default false,
  access_status public.access_status not null default 'pending',
  request_note text,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'requested_role' = 'admin' then 'admin'::public.portal_role
    else 'steward'::public.portal_role
  end;

  insert into public.profiles (id, email, full_name, phone, share_email, share_phone, role, active, access_status, request_note)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), new.email),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce((new.raw_user_meta_data ->> 'share_email')::boolean, false),
    coalesce((new.raw_user_meta_data ->> 'share_phone')::boolean, false),
    requested_role,
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
    where id = auth.uid() and active = true and role = 'admin'
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
    where id = auth.uid() and active = true and role = 'steward'
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
with check (public.is_active_user() and created_by = auth.uid());

create policy "cases_update_authorized"
on public.cases for update
using (public.can_access_case(id))
with check (public.can_access_case(id));

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
using (public.is_active_user());

create policy "resources_admin_manage"
on public.resources for all
using (public.is_admin())
with check (public.is_admin());

create policy "questions_public_answered"
on public.public_questions for select
using (status = 'answered');

create policy "questions_public_insert"
on public.public_questions for insert
with check (status = 'pending');

create policy "questions_moderator_manage"
on public.public_questions for all
using (public.is_active_user())
with check (public.is_active_user());

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
  public.is_active_user()
  and (kind = 'general' or public.is_steward())
);

create policy "internal_files_insert_authorized"
on public.internal_files for insert
with check (
  public.is_active_user()
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
  and public.is_active_user()
  and ((storage.foldername(name))[1] = 'general' or public.is_steward())
);

create policy "storage_insert_authorized_internal_files"
on storage.objects for insert
with check (
  bucket_id = 'internal-files'
  and public.is_active_user()
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
