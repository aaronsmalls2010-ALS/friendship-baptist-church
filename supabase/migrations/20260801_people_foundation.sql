-- 2026-08-01 — People foundation (applied to prod). Membership lifecycle fields,
-- head-of-household marker, and a children/dependents table.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_date DATE,
  ADD COLUMN IF NOT EXISTS membership_type TEXT NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS how_joined TEXT,
  ADD COLUMN IF NOT EXISTS marital_status TEXT,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS preferred_contact TEXT NOT NULL DEFAULT 'email';

ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS is_head BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.children (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID REFERENCES public.families(id) ON DELETE CASCADE,
  guardian_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  first_name   TEXT NOT NULL,
  last_name    TEXT,
  birthdate    DATE,
  grade        TEXT,
  allergies    TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_children_family ON public.children(family_id);
CREATE INDEX IF NOT EXISTS idx_children_guardian ON public.children(guardian_id);
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS children_access ON public.children;
CREATE POLICY children_access ON public.children
  FOR ALL
  USING (guardian_id = auth.uid() OR public.is_admin())
  WITH CHECK (guardian_id = auth.uid() OR public.is_admin());
