-- Phase 1 §1.3 — Add user_agent to audit_log (column absent from initial schema)

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Update RLS: admins/super_admins can read; service role inserts (no anon insert needed)
DROP POLICY IF EXISTS audit_log_read ON public.audit_log;
CREATE POLICY audit_log_read ON public.audit_log
  FOR SELECT USING (public.is_admin());

-- No insert policy — all inserts go through service-role (admin client) which bypasses RLS
