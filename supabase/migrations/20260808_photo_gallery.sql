-- 2026-08-08 — Community photo gallery: member uploads + admin moderation.
-- Public sees ONLY approved photos; pending images never leave the private bucket.

-- ── Albums ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gallery_albums (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Photos ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploader_name TEXT NOT NULL,                       -- display snapshot at upload time
  caption       TEXT,
  album_id      UUID REFERENCES public.gallery_albums(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected')),
  image_path    TEXT NOT NULL,                       -- object path (review bucket, then public)
  thumb_path    TEXT NOT NULL,
  width         INT,
  height        INT,
  review_note   TEXT,
  reviewed_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_gallery_photos_status     ON public.gallery_photos(status);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_album      ON public.gallery_photos(album_id);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_approved   ON public.gallery_photos(status, approved_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_uploader   ON public.gallery_photos(uploader_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

-- Albums: anyone may read; only admins may write.
DROP POLICY IF EXISTS gallery_albums_read ON public.gallery_albums;
CREATE POLICY gallery_albums_read ON public.gallery_albums
  FOR SELECT USING (true);
DROP POLICY IF EXISTS gallery_albums_admin ON public.gallery_albums;
CREATE POLICY gallery_albums_admin ON public.gallery_albums
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Photos: public sees approved only; a member sees their own (any status); admins see all.
DROP POLICY IF EXISTS gallery_photos_read ON public.gallery_photos;
CREATE POLICY gallery_photos_read ON public.gallery_photos
  FOR SELECT USING (
    status = 'approved'
    OR uploader_id = auth.uid()
    OR public.is_admin()
  );

-- A member may create only their OWN, PENDING rows (cannot self-approve).
DROP POLICY IF EXISTS gallery_photos_insert ON public.gallery_photos;
CREATE POLICY gallery_photos_insert ON public.gallery_photos
  FOR INSERT TO authenticated
  WITH CHECK (uploader_id = auth.uid() AND status = 'pending');

-- Admins may update/moderate any row.
DROP POLICY IF EXISTS gallery_photos_admin ON public.gallery_photos;
CREATE POLICY gallery_photos_admin ON public.gallery_photos
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- A member may delete only their OWN, still-PENDING row.
DROP POLICY IF EXISTS gallery_photos_delete_own ON public.gallery_photos;
CREATE POLICY gallery_photos_delete_own ON public.gallery_photos
  FOR DELETE TO authenticated
  USING (uploader_id = auth.uid() AND status = 'pending');

-- ── Storage buckets ─────────────────────────────────────────────────────────
-- Private review bucket (pending) + public bucket (approved). Server API uses the
-- service role for all storage writes, so no permissive storage.objects policies
-- are needed; the public bucket is world-readable by design.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('gallery-review', 'gallery-review', false, 20971520)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('gallery-public', 'gallery-public', true, 20971520)
ON CONFLICT (id) DO NOTHING;

-- ── Seed a few starter albums (optional; admins can add/rename later) ─────────
INSERT INTO public.gallery_albums (name, slug, sort_order) VALUES
  ('Sunday Worship', 'sunday-worship', 1),
  ('Fellowship & Events', 'fellowship-events', 2),
  ('Ministries', 'ministries', 3),
  ('Community Outreach', 'community-outreach', 4)
ON CONFLICT (slug) DO NOTHING;
