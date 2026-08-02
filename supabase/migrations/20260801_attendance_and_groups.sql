-- 2026-08-01 — Attendance + Groups modules (applied to prod).

-- ============ ATTENDANCE ============
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  session_date DATE NOT NULL,
  type         TEXT NOT NULL DEFAULT 'service',
  ministry_id  UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
  group_id     UUID,
  event_id     UUID REFERENCES public.events(id) ON DELETE SET NULL,
  headcount    INTEGER,
  notes        TEXT,
  created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON public.attendance_sessions(session_date);

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  profile_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id      UUID REFERENCES public.children(id) ON DELETE CASCADE,
  present       BOOLEAN NOT NULL DEFAULT true,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE (session_id, profile_id),
  UNIQUE (session_id, child_id)
);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON public.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_profile ON public.attendance_records(profile_id);

ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS attendance_sessions_admin ON public.attendance_sessions;
CREATE POLICY attendance_sessions_admin ON public.attendance_sessions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS attendance_records_admin ON public.attendance_records;
CREATE POLICY attendance_records_admin ON public.attendance_records FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ GROUPS ============
CREATE TABLE IF NOT EXISTS public.groups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  category     TEXT,
  meeting_day  TEXT,
  meeting_time TEXT,
  location     TEXT,
  leader_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  capacity     INTEGER,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  is_open      BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id   UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member',
  status     TEXT NOT NULL DEFAULT 'approved',
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, profile_id)
);
CREATE INDEX IF NOT EXISTS idx_group_members_profile ON public.group_members(profile_id);

ALTER TABLE public.attendance_sessions
  DROP CONSTRAINT IF EXISTS attendance_sessions_group_fk,
  ADD CONSTRAINT attendance_sessions_group_fk FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE SET NULL;

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS groups_read ON public.groups;
CREATE POLICY groups_read ON public.groups FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS groups_admin ON public.groups;
CREATE POLICY groups_admin ON public.groups FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS group_members_read ON public.group_members;
CREATE POLICY group_members_read ON public.group_members FOR SELECT TO authenticated
  USING (public.is_admin() OR profile_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.profile_id = auth.uid() AND gm.status = 'approved'));
DROP POLICY IF EXISTS group_members_self ON public.group_members;
CREATE POLICY group_members_self ON public.group_members FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
DROP POLICY IF EXISTS group_members_leave ON public.group_members;
CREATE POLICY group_members_leave ON public.group_members FOR DELETE TO authenticated USING (profile_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS group_members_admin ON public.group_members;
CREATE POLICY group_members_admin ON public.group_members FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
