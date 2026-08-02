-- 2026-08-02 — Tags/segments + prayer-wall interaction (applied to prod).

CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.profile_tags (
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_profile_tags_tag ON public.profile_tags(tag_id);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tags_admin ON public.tags;
CREATE POLICY tags_admin ON public.tags FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS profile_tags_admin ON public.profile_tags;
CREATE POLICY profile_tags_admin ON public.profile_tags FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.prayer_prayed (
  request_id UUID NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, profile_id)
);
ALTER TABLE public.prayer_requests ADD COLUMN IF NOT EXISTS prayed_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.prayer_prayed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS prayer_prayed_read ON public.prayer_prayed;
CREATE POLICY prayer_prayed_read ON public.prayer_prayed FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS prayer_prayed_self ON public.prayer_prayed;
CREATE POLICY prayer_prayed_self ON public.prayer_prayed FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
DROP POLICY IF EXISTS prayer_prayed_unself ON public.prayer_prayed;
CREATE POLICY prayer_prayed_unself ON public.prayer_prayed FOR DELETE TO authenticated USING (profile_id = auth.uid());
