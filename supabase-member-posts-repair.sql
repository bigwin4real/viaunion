-- Repair guide/post storage on the existing project after inspecting its schema.
-- Transactional and preserves existing posts, including deliberate seed deletions.
begin;
do $repair$
declare is_new boolean := to_regclass('public.member_posts') is null;
begin
create table if not exists public.member_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  topic text not null default 'Member update',
  contract public.case_contract not null default 'Shared',
  excerpt text not null,
  body text not null,
  amount text,
  frequency text,
  timeframe text,
  requirements text,
  agreement_reference text,
  source_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  author_id uuid references public.profiles(id) on delete set null,
  author_name text not null default 'Local 4005 member',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

if is_new then
insert into public.member_posts (
  id,
  title,
  topic,
  contract,
  excerpt,
  body,
  amount,
  frequency,
  timeframe,
  requirements,
  agreement_reference,
  source_url,
  status,
  author_name,
  published_at
)
select
  '40050000-0000-4000-8000-000000000038'::uuid,
  'Safety boot allowance',
  'Allowance',
  'Contract 1'::public.case_contract,
  'Eligible employees required to wear safety footwear receive $150 each year.',
  'The allowance is paid automatically in the second pay period of September. When you buy new safety footwear, bring the footwear and your proof of purchase to your immediate supervisor. The footwear must meet the applicable Canada Occupational Health and Safety requirements and be CSA approved.',
  '$150',
  'Every year',
  'Second pay period of September',
  E'Required by VIA Rail to wear safety footwear\nIn service at the beginning of the calendar year\nRendered compensated service during the year\nStill holds an employment relationship\nShow the footwear and proof of purchase to your supervisor\nFootwear must be CSA approved',
  'Agreement No. 1 (2025–2027), Article 38.4',
  'https://irp.cdn-website.com/a76b4e57/files/uploaded/Collective%2BAgreement%2B1%2B2025-2026-2027%2B-%2BEN.pdf',
  'published',
  'Local 4005',
  now()
where not exists (
  select 1
  from public.member_posts
  where lower(title) = lower('Safety boot allowance')
);

end if;
end;
$repair$;
alter table public.member_posts enable row level security;

drop trigger if exists member_posts_touch_updated_at on public.member_posts;
create trigger member_posts_touch_updated_at
before update on public.member_posts
for each row execute function public.touch_updated_at();

drop policy if exists "member_posts_read" on public.member_posts;
create policy "member_posts_read"
on public.member_posts for select
using (
  status = 'published'
  or author_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "member_posts_active_insert" on public.member_posts;
create policy "member_posts_active_insert"
on public.member_posts for insert
with check (
  public.is_active_user()
  and author_id = auth.uid()
);

drop policy if exists "member_posts_author_update" on public.member_posts;
create policy "member_posts_author_update"
on public.member_posts for update
using (
  public.is_active_user()
  and (author_id = auth.uid() or public.is_admin())
)
with check (
  public.is_active_user()
  and (author_id = auth.uid() or public.is_admin())
);

drop policy if exists "member_posts_author_delete" on public.member_posts;
create policy "member_posts_author_delete"
on public.member_posts for delete
using (
  public.is_active_user()
  and (author_id = auth.uid() or public.is_admin())
);

grant select on public.member_posts to anon, authenticated;
grant insert, update, delete on public.member_posts to authenticated;
notify pgrst, 'reload schema';
commit;
