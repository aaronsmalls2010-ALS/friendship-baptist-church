-- 2026-08-01 — Reconcile prod with the repo. Several earlier migrations were
-- never applied to production, so shipped code referenced objects that didn't
-- exist (the Members page 500'd on a missing profiles.status column). This file
-- documents what was applied directly to prod on 2026-08-01 so repo == prod:
--
--   * profiles.status (member_status enum)      — 20260609_member_status.sql
--   * care_notes table + PASTORAL-only RLS       — 20260609_care_notes.sql (corrected)
--   * sms_templates table                        — 20260609_sms_templates.sql
--   * profiles SELECT RLS lockdown (C2)          — 20260801_profiles_rls_lockdown_c2.sql
--   * ministry_messages (sender_id, not sent_by) — see below
--   * ministry_members.status                    — see below
--
-- The statements below are the ministry pieces (idempotent); the others live in
-- their own migration files listed above.

CREATE TABLE IF NOT EXISTS public.ministry_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id UUID NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL,
  body        TEXT NOT NULL,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ministry_messages_ministry ON public.ministry_messages(ministry_id);
ALTER TABLE public.ministry_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ministry_messages_admin ON public.ministry_messages;
CREATE POLICY ministry_messages_admin ON public.ministry_messages
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.ministry_members
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';
CREATE INDEX IF NOT EXISTS idx_ministry_members_status ON public.ministry_members(status);
