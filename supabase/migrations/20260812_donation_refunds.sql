-- Refund tracking for donations (Stripe refunds processed from the admin).
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS refunded_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT,
  ADD COLUMN IF NOT EXISTS refund_status    TEXT NOT NULL DEFAULT 'none';

ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS donations_refund_status_check;
ALTER TABLE public.donations
  ADD CONSTRAINT donations_refund_status_check CHECK (refund_status IN ('none','partial','full'));
