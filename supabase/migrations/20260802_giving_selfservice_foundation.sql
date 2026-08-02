-- 2026-08-02 — Giving (campaigns/pledges) + self-service foundation (applied to prod).

CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, description TEXT, goal_amount NUMERIC(12,2),
  start_date DATE, end_date DATE, is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.pledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL, note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pledges_campaign ON public.pledges(campaign_id);
CREATE INDEX IF NOT EXISTS idx_pledges_profile ON public.pledges(profile_id);
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_donations_profile_date ON public.donations(profile_id, date);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS campaigns_read ON public.campaigns;
CREATE POLICY campaigns_read ON public.campaigns FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS campaigns_admin ON public.campaigns;
CREATE POLICY campaigns_admin ON public.campaigns FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS pledges_own ON public.pledges;
CREATE POLICY pledges_own ON public.pledges FOR SELECT TO authenticated USING (profile_id = auth.uid() OR public.is_finance_team() OR public.is_admin());
DROP POLICY IF EXISTS pledges_insert ON public.pledges;
CREATE POLICY pledges_insert ON public.pledges FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS pledges_admin ON public.pledges;
CREATE POLICY pledges_admin ON public.pledges FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.connection_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT, email TEXT, phone TEXT,
  card_type TEXT NOT NULL DEFAULT 'connect',
  message TEXT, status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_connection_cards_status ON public.connection_cards(status);
ALTER TABLE public.connection_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS connection_cards_insert ON public.connection_cards;
CREATE POLICY connection_cards_insert ON public.connection_cards FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS connection_cards_admin ON public.connection_cards;
CREATE POLICY connection_cards_admin ON public.connection_cards FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS directory_show_phone   BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS directory_show_email   BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS directory_show_address BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_events     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_prayer     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_giving     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_newsletter BOOLEAN NOT NULL DEFAULT true;
