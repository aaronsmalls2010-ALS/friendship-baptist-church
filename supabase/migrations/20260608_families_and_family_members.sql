-- Families: a member can belong to several families (blended/extended households).
-- Applied to production 2026-06-08.
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  relationship text,
  joined_at timestamptz not null default now(),
  primary key (family_id, profile_id)
);

alter table public.families enable row level security;
alter table public.family_members enable row level security;

create or replace function public.is_family_member(fid uuid)
returns boolean language sql stable security definer set search_path = '' as $fn$
  select exists (
    select 1 from public.family_members
    where family_id = fid and profile_id = auth.uid()
  );
$fn$;

drop policy if exists families_select on public.families;
create policy families_select on public.families
  for select using (auth.uid() is not null);

drop policy if exists families_admin_write on public.families;
create policy families_admin_write on public.families
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists family_members_select on public.family_members;
create policy family_members_select on public.family_members
  for select using (public.is_family_member(family_id) or public.is_admin());

drop policy if exists family_members_insert on public.family_members;
create policy family_members_insert on public.family_members
  for insert with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists family_members_delete on public.family_members;
create policy family_members_delete on public.family_members
  for delete using (profile_id = auth.uid() or public.is_admin());

drop policy if exists family_members_update on public.family_members;
create policy family_members_update on public.family_members
  for update using (public.is_admin()) with check (public.is_admin());
