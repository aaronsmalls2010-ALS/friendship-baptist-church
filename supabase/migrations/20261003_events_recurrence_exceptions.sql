-- 2026-10-03 — Skip individual dates of a recurring event (e.g. no Youth Sunday on a
-- pastoral anniversary Sunday) without ending the whole series.
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS recurrence_exceptions date[] NOT NULL DEFAULT '{}';
