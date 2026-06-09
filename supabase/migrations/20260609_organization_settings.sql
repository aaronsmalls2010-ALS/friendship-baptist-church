-- Phase 1 §1.1 — Organization profile / settings persistence

CREATE TABLE IF NOT EXISTS public.organization_settings (
  id               INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  church_name      TEXT NOT NULL DEFAULT 'The Friendship Baptist Church',
  tagline          TEXT NOT NULL DEFAULT 'The Church That Christ Built',
  pastor_name      TEXT NOT NULL DEFAULT 'Pastor Isiah Smalls',
  address_street   TEXT NOT NULL DEFAULT '36 Friendship Lane',
  address_city     TEXT NOT NULL DEFAULT 'Beaufort',
  address_state    TEXT NOT NULL DEFAULT 'SC',
  address_zip      TEXT NOT NULL DEFAULT '29907',
  phone            TEXT NOT NULL DEFAULT '(843) 525-1509',
  email            TEXT NOT NULL DEFAULT 'info@thefriendshipbaptist.com',
  ein              TEXT,
  office_hours     TEXT NOT NULL DEFAULT 'Monday - Friday: 9:00 AM - 3:00 PM',
  notify_new_members    BOOLEAN NOT NULL DEFAULT true,
  notify_donations      BOOLEAN NOT NULL DEFAULT true,
  notify_prayer         BOOLEAN NOT NULL DEFAULT false,
  notify_sms_events     BOOLEAN NOT NULL DEFAULT false,
  notify_weekly_digest  BOOLEAN NOT NULL DEFAULT true,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Seed with church info defaults (single row, id=1)
INSERT INTO public.organization_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read org settings
DROP POLICY IF EXISTS org_settings_read ON public.organization_settings;
CREATE POLICY org_settings_read ON public.organization_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only super_admin can write
DROP POLICY IF EXISTS org_settings_write ON public.organization_settings;
CREATE POLICY org_settings_write ON public.organization_settings
  FOR ALL USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
