-- Phase 5 §#46 — Event end time + media audio_url

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recurrence TEXT CHECK (recurrence IN ('none','weekly','monthly'));

-- Validate end > start via trigger would be complex; enforce in app layer
-- Set default recurrence
UPDATE public.events SET recurrence = 'none' WHERE recurrence IS NULL;

-- Add audio_url to sermons and music for file upload §#44
ALTER TABLE public.sermons
  ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- music_tracks already likely has audio_url; add if missing
DO $$ BEGIN
  ALTER TABLE public.music_tracks ADD COLUMN IF NOT EXISTS audio_url TEXT;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
