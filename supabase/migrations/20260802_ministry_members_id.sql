-- 2026-08-02 — ministry_members surrogate id + updated_at (applied to prod).
-- Admin roster and portal join/leave code referenced ministry_members.id and
-- updated_at, but the table only had the composite PK (ministry_id, profile_id),
-- so joining a ministry failed ("Failed to check membership status") and roster
-- role changes broke. Add the columns; keep the composite PK.
ALTER TABLE public.ministry_members ADD COLUMN IF NOT EXISTS id UUID NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS ministry_members_id_key ON public.ministry_members(id);
ALTER TABLE public.ministry_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
