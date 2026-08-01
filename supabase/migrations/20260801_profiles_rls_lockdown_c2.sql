-- C2 security fix (applied to prod 2026-08-01).
-- The "Anyone can read profiles" SELECT policy was USING (true) for role `public`
-- (which includes anon), so the public anon key could dump the entire member
-- roster (name, email, phone, DOB) via /rest/v1/profiles. Restrict SELECT to
-- authenticated users, scoped to their own row, admins, or members who opted
-- into the directory and are not archived.
drop policy if exists "Anyone can read profiles" on public.profiles;

create policy "Profiles readable by owner, admins, opted-in directory"
  on public.profiles
  for select
  to authenticated
  using (
    auth.uid() = id
    or public.is_admin()
    or (coalesce(public_directory, false) = true and archived_at is null)
  );

-- Belt-and-suspenders (do in the Supabase dashboard, not here): remove `public`
-- from Data API → Exposed schemas so the REST surface isn't reachable by anon at
-- all. The policy above already returns 0 rows to anon; this hardens it further.
