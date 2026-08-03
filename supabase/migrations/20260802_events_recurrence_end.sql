-- 2026-08-02 — Optional "repeats until" end date for recurring events (prod).
-- The events.recurrence text column already existed; this bounds it.
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS recurrence_end DATE;
