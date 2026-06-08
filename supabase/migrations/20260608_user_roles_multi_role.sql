-- Multi-role: a member can hold several roles at once.
-- Applied to production 2026-06-08.
create table if not exists public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table public.user_roles enable row level security;

-- Backfill from the existing single primary role.
insert into public.user_roles (user_id, role)
select id, role from public.profiles
on conflict (user_id, role) do nothing;

-- Authoritative role checks now read user_roles. Because every existing RLS
-- policy calls these three helpers, multi-role is respected everywhere at once.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $fn$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('admin','super_admin')
  );
$fn$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = '' as $fn$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'super_admin'
  );
$fn$;

-- ministry_members has no status column; the prior function referenced a
-- non-existent column. Checking membership directly fixes that latent bug.
create or replace function public.is_finance_team()
returns boolean language sql stable security definer set search_path = '' as $fn$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'super_admin'
  ) or exists (
    select 1 from public.ministry_members mm
    join public.ministries m on mm.ministry_id = m.id
    where mm.profile_id = auth.uid()
      and m.name = 'Finance Committee'
  );
$fn$;

-- Keep profiles.role as the "primary" (highest) role for display, default
-- redirect, and backward compat. The user_role enum's own order is precedence.
create or replace function public.sync_primary_role()
returns trigger language plpgsql security definer set search_path = '' as $fn$
declare
  top public.user_role;
  uid uuid := coalesce(new.user_id, old.user_id);
begin
  select role into top from public.user_roles
   where user_id = uid order by role desc limit 1;
  update public.profiles
     set role = coalesce(top, 'member'::public.user_role), updated_at = now()
   where id = uid;
  return null;
end; $fn$;

drop trigger if exists user_roles_sync_primary on public.user_roles;
create trigger user_roles_sync_primary
after insert or update or delete on public.user_roles
for each row execute function public.sync_primary_role();

-- RLS: users read their own roles; admins manage everyone's.
drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists user_roles_admin_write on public.user_roles;
create policy user_roles_admin_write on public.user_roles
  for all using (public.is_admin()) with check (public.is_admin());
