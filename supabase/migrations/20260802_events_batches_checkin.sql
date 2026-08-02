-- 2026-08-02 — Event capacity/waitlist, batch offering entry, child check-in codes (prod).
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS capacity INTEGER,
  ADD COLUMN IF NOT EXISTS allow_waitlist BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.event_rsvps
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'going',
  ADD COLUMN IF NOT EXISTS guests INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.donation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_date DATE NOT NULL, description TEXT, expected_total NUMERIC(12,2),
  reconciled BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.donation_batches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_donations_batch ON public.donations(batch_id);
ALTER TABLE public.donation_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS donation_batches_finance ON public.donation_batches;
CREATE POLICY donation_batches_finance ON public.donation_batches FOR ALL USING (public.is_finance_team() OR public.is_admin()) WITH CHECK (public.is_finance_team() OR public.is_admin());

ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS security_code TEXT;
-- Child checkout marks this instead of deleting the row (keeps attendance count).
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMPTZ;
