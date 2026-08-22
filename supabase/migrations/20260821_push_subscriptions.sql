-- ─────────────────────────────────────────────────────────────────────────────
-- Web Push (PWA) notification subscriptions
--
-- One row per browser/device a member has enabled notifications on. The
-- endpoint is the push service URL issued by the browser vendor and is globally
-- unique, so re-subscribing the same device updates the existing row rather
-- than creating a duplicate.
--
-- RLS: owner-only. The server-side sender uses the service-role client (which
-- bypasses RLS) to fan out; nothing else may read another member's endpoints.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  endpoint     text not null unique,
  p256dh       text not null,
  auth         text not null,
  user_agent   text,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists push_subscriptions_profile_id_idx
  on public.push_subscriptions (profile_id);

alter table public.push_subscriptions enable row level security;

-- Owner-only access for authenticated members.
drop policy if exists "own push subscriptions select" on public.push_subscriptions;
create policy "own push subscriptions select"
  on public.push_subscriptions for select
  to authenticated
  using (profile_id = auth.uid());

drop policy if exists "own push subscriptions insert" on public.push_subscriptions;
create policy "own push subscriptions insert"
  on public.push_subscriptions for insert
  to authenticated
  with check (profile_id = auth.uid());

drop policy if exists "own push subscriptions update" on public.push_subscriptions;
create policy "own push subscriptions update"
  on public.push_subscriptions for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists "own push subscriptions delete" on public.push_subscriptions;
create policy "own push subscriptions delete"
  on public.push_subscriptions for delete
  to authenticated
  using (profile_id = auth.uid());
