-- Phase 1 §1.4 — Soft-delete / archive columns

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.memorials
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_archived  ON public.profiles(archived_at) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_donations_archived ON public.donations(archived_at) WHERE archived_at IS NULL;
