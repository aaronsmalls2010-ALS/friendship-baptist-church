-- Refund tracking for donations (Stripe refunds processed from the admin).
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS refunded_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_at      TIMESTAMPTZ,
  -- Plain UUID (NOT a FK): a second donations->profiles FK makes PostgREST
  -- embeds ambiguous and breaks the donations list query. Audit-only field.
  ADD COLUMN IF NOT EXISTS refunded_by      UUID,
  ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT,
  ADD COLUMN IF NOT EXISTS refund_status    TEXT NOT NULL DEFAULT 'none';

ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS donations_refund_status_check;
ALTER TABLE public.donations
  ADD CONSTRAINT donations_refund_status_check CHECK (refund_status IN ('none','partial','full'));
