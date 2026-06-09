-- Phase 5 §#24 — Saved devotionals persistence

CREATE TABLE IF NOT EXISTS public.saved_devotionals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  devotional_id UUID NOT NULL REFERENCES public.devotionals(id) ON DELETE CASCADE,
  saved_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, devotional_id)
);

ALTER TABLE public.saved_devotionals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saved_devotionals_own ON public.saved_devotionals;
CREATE POLICY saved_devotionals_own ON public.saved_devotionals
  FOR ALL USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_saved_devotionals_profile ON public.saved_devotionals(profile_id);
