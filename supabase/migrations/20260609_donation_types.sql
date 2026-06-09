-- Phase 1 §1.6b — Finance-managed donation types table

CREATE TABLE IF NOT EXISTS public.donation_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed with the existing hardcoded enum values (preserves existing data mapping)
INSERT INTO public.donation_types (name, slug, sort_order) VALUES
  ('Tithe',          'tithe',         1),
  ('Offering',       'offering',      2),
  ('Building Fund',  'building_fund', 3),
  ('Mission',        'mission',       4),
  ('Other',          'other',         5)
ON CONFLICT (slug) DO NOTHING;

-- Add FK column to donations (keep old donation_type enum column for safety)
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS donation_type_id UUID REFERENCES public.donation_types(id) ON DELETE SET NULL;

-- Backfill donation_type_id from the existing donation_type enum text
UPDATE public.donations d
SET donation_type_id = dt.id
FROM public.donation_types dt
WHERE dt.slug = d.donation_type::TEXT
  AND d.donation_type_id IS NULL;

ALTER TABLE public.donation_types ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read types (needed for donation forms)
DROP POLICY IF EXISTS donation_types_read ON public.donation_types;
CREATE POLICY donation_types_read ON public.donation_types
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Finance roles can manage types
DROP POLICY IF EXISTS donation_types_finance_write ON public.donation_types;
CREATE POLICY donation_types_finance_write ON public.donation_types
  FOR ALL USING (public.is_finance_team())
  WITH CHECK (public.is_finance_team());

CREATE INDEX IF NOT EXISTS idx_donations_type_id ON public.donations(donation_type_id);
CREATE INDEX IF NOT EXISTS idx_donation_types_active ON public.donation_types(is_active, sort_order);
