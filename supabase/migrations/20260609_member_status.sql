-- Phase 3 §#14 — Member status

DO $$ BEGIN
  CREATE TYPE member_status AS ENUM ('active', 'inactive', 'visitor', 'deceased');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status member_status NOT NULL DEFAULT 'active';

-- Default all existing members to 'active'
UPDATE public.profiles SET status = 'active' WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
