-- Phase 1 §1.7 — Add columns for manual (cash/check) donation entry

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS method      TEXT NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS check_number TEXT,
  ADD COLUMN IF NOT EXISTS note        TEXT,
  ADD COLUMN IF NOT EXISTS metadata    JSONB DEFAULT '{}';

-- Backfill: existing Stripe donations get method='stripe'
-- (already satisfied by the DEFAULT above)
