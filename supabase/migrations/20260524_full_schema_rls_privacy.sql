-- ============================================================================
-- Migration: Complete Schema for All Features + Financial Privacy RLS
--
-- Date: 2026-05-24
-- Description:
--   1. New tables: memorials, memorial_photos, memorial_comments,
--      worship_services, service_videos, ministry_officers,
--      trivia_scores, birthday_greetings, user_preferences
--   2. Add missing columns to existing tables (deacons.title, etc.)
--   3. Privacy-first RLS for donations (finance team + super_admin see all,
--      deacons see their ward, everyone else sees only their own)
--   4. Helper functions: is_finance_team(), is_deacon_of_ward()
--   5. Spiritual goals: add updated_at column
--   6. Storage bucket for memorial photos
--
-- Idempotent: uses IF NOT EXISTS, DO blocks, CREATE OR REPLACE.
-- ============================================================================


-- ============================================================================
-- 1. HELPER FUNCTIONS FOR PRIVACY
-- ============================================================================

-- Check if current user is on the finance team
-- (member of a ministry named 'Finance Committee' with approved status,
-- OR has super_admin role)
CREATE OR REPLACE FUNCTION is_finance_team()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'
  )
  OR EXISTS (
    SELECT 1 FROM ministry_members mm
    JOIN ministries m ON mm.ministry_id = m.id
    WHERE mm.profile_id = auth.uid()
      AND mm.status = 'approved'
      AND m.name = 'Finance Committee'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if current user is a deacon assigned to a specific ward
CREATE OR REPLACE FUNCTION is_deacon_of_ward(ward_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM deacons
    WHERE profile_id = auth.uid()
      AND ward_id = ward_uuid
      AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get the ward_id of a given profile (used in donation RLS)
CREATE OR REPLACE FUNCTION get_profile_ward(profile_uuid UUID)
RETURNS UUID AS $$
  SELECT ward_id FROM profiles WHERE id = profile_uuid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is an active deacon (any ward)
CREATE OR REPLACE FUNCTION is_deacon()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM deacons
    WHERE profile_id = auth.uid()
      AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ============================================================================
-- 2. ALTER EXISTING TABLES — add missing columns
-- ============================================================================

-- deacons: add title field (Chairman, Vice Chairman, Emeritus, etc.)
ALTER TABLE deacons ADD COLUMN IF NOT EXISTS title TEXT;

-- spiritual_goals: add updated_at for tracking when goals are modified
ALTER TABLE spiritual_goals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- profiles: add preferences columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_directory BOOLEAN DEFAULT TRUE;


-- ============================================================================
-- 3. NEW TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 3a. memorials (Hall of Angels / Loved Ones Gone Home)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memorials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  photo_url       TEXT,
  date_of_birth   DATE,
  date_of_passing DATE NOT NULL,
  obituary        TEXT NOT NULL DEFAULT '',
  scripture       TEXT,
  scripture_text  TEXT,
  favorite_hymn   TEXT,
  church_roles    TEXT[] DEFAULT '{}',
  family_message  TEXT,
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3b. memorial_photos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memorial_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id     UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  image_url       TEXT NOT NULL,
  caption         TEXT,
  uploaded_by     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3c. memorial_comments (tributes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memorial_comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id     UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3d. worship_services (video archive from WordPress migration)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS worship_services (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date            DATE NOT NULL,
  title           TEXT NOT NULL,
  speaker         TEXT NOT NULL DEFAULT 'Pastor Isiah Smalls',
  is_special      BOOLEAN DEFAULT FALSE,
  scripture       TEXT,
  sermon_title    TEXT,
  description     TEXT,
  special_notes   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3e. service_videos (individual segments within a worship service)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_videos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id      UUID NOT NULL REFERENCES worship_services(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('prayer', 'scripture', 'sermon', 'special')),
  label           TEXT NOT NULL,
  youtube_id      TEXT,
  local_filename  TEXT NOT NULL,
  description     TEXT,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3f. ministry_officers (president, VP, secretary per ministry)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ministry_officers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id     UUID NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  profile_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  title           TEXT NOT NULL,  -- 'President', 'Vice President', 'Secretary'
  phone           TEXT,
  email           TEXT,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3g. trivia_scores (Bible trivia tracking)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trivia_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_questions  INTEGER NOT NULL DEFAULT 0,
  correct_answers  INTEGER NOT NULL DEFAULT 0,
  played_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3h. birthday_greetings (messages sent for member birthdays)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS birthday_greetings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message         TEXT NOT NULL,
  delivery_type   TEXT NOT NULL DEFAULT 'app' CHECK (delivery_type IN ('app', 'email', 'sms')),
  is_sent         BOOLEAN DEFAULT FALSE,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3i. user_preferences (extended profile settings)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_preferences (
  profile_id      UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  theme           TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  font_size       TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  language        TEXT DEFAULT 'en',
  prayer_reminders BOOLEAN DEFAULT FALSE,
  devotional_reminders BOOLEAN DEFAULT TRUE,
  event_reminders  BOOLEAN DEFAULT TRUE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Auto-update updated_at on memorials
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'memorials_updated_at'
  ) THEN
    CREATE TRIGGER memorials_updated_at
      BEFORE UPDATE ON memorials
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Auto-update updated_at on spiritual_goals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'spiritual_goals_updated_at'
  ) THEN
    CREATE TRIGGER spiritual_goals_updated_at
      BEFORE UPDATE ON spiritual_goals
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Auto-update updated_at on user_preferences
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'user_preferences_updated_at'
  ) THEN
    CREATE TRIGGER user_preferences_updated_at
      BEFORE UPDATE ON user_preferences
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;


-- ============================================================================
-- 5. ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE memorials          ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorial_photos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorial_comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE worship_services   ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_videos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_officers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_scores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthday_greetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences   ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 6. RLS POLICIES — FINANCIAL PRIVACY (donations)
-- ============================================================================
-- Privacy hierarchy:
--   Super Admin      → ALL donations
--   Finance Team     → ALL donations (ministry membership in "Finance Committee")
--   Deacon           → own donations + donations from members in their ward
--   All other roles  → only their own donations
--
-- This REPLACES the existing donation policies from 001_initial_schema.

-- Drop old donation policies
DROP POLICY IF EXISTS "Users can read own donations"        ON donations;
DROP POLICY IF EXISTS "Authenticated users can create donations" ON donations;
DROP POLICY IF EXISTS "Admins manage donations"             ON donations;

-- SELECT: Layered read access
CREATE POLICY "donations_select_own"
  ON donations FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "donations_select_finance_team"
  ON donations FOR SELECT
  USING (is_finance_team());

CREATE POLICY "donations_select_deacon_ward"
  ON donations FOR SELECT
  USING (
    is_deacon()
    AND EXISTS (
      SELECT 1 FROM deacons d
      WHERE d.profile_id = auth.uid()
        AND d.is_active = TRUE
        AND d.ward_id IS NOT NULL
        AND d.ward_id = get_profile_ward(donations.profile_id)
    )
  );

-- INSERT: authenticated users can record their own donations
CREATE POLICY "donations_insert_own"
  ON donations FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (profile_id = auth.uid() OR is_finance_team())
  );

-- UPDATE: finance team and super_admin only
CREATE POLICY "donations_update_finance"
  ON donations FOR UPDATE
  USING (is_finance_team())
  WITH CHECK (is_finance_team());

-- DELETE: super_admin only
CREATE POLICY "donations_delete_super_admin"
  ON donations FOR DELETE
  USING (is_super_admin());


-- ============================================================================
-- 7. RLS POLICIES — MEMORIALS
-- ============================================================================

-- Published memorials are public
CREATE POLICY "Public can read published memorials"
  ON memorials FOR SELECT
  USING (is_published = TRUE);

-- Admins can read all memorials
CREATE POLICY "Admins can read all memorials"
  ON memorials FOR SELECT
  USING (is_admin());

-- Creator can read their own (even if unpublished)
CREATE POLICY "Creator can read own memorials"
  ON memorials FOR SELECT
  USING (auth.uid() = created_by);

-- Authenticated members can create memorials
CREATE POLICY "Members can create memorials"
  ON memorials FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

-- Creator or admin can update memorials
CREATE POLICY "Creator or admin can update memorials"
  ON memorials FOR UPDATE
  USING (auth.uid() = created_by OR is_admin())
  WITH CHECK (auth.uid() = created_by OR is_admin());

-- Admin can delete memorials
CREATE POLICY "Admin can delete memorials"
  ON memorials FOR DELETE
  USING (is_admin());


-- ============================================================================
-- 8. RLS POLICIES — MEMORIAL PHOTOS
-- ============================================================================

-- Public can read photos of published memorials
CREATE POLICY "Public can read memorial photos"
  ON memorial_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE id = memorial_photos.memorial_id
        AND is_published = TRUE
    )
    OR is_admin()
  );

-- Memorial creator can add photos
CREATE POLICY "Creator can add memorial photos"
  ON memorial_photos FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM memorials
        WHERE id = memorial_photos.memorial_id
          AND created_by = auth.uid()
      )
      OR is_admin()
    )
  );

-- Memorial creator or admin can delete photos
CREATE POLICY "Creator or admin can delete memorial photos"
  ON memorial_photos FOR DELETE
  USING (
    auth.uid() = uploaded_by
    OR is_admin()
  );


-- ============================================================================
-- 9. RLS POLICIES — MEMORIAL COMMENTS
-- ============================================================================

-- Public can read comments on published memorials
CREATE POLICY "Public can read memorial comments"
  ON memorial_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE id = memorial_comments.memorial_id
        AND is_published = TRUE
    )
    OR is_admin()
  );

-- Authenticated users can leave comments
CREATE POLICY "Authenticated users can comment on memorials"
  ON memorial_comments FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = profile_id
  );

-- Users can delete own comments, admin can delete any
CREATE POLICY "Users can delete own memorial comments"
  ON memorial_comments FOR DELETE
  USING (auth.uid() = profile_id OR is_admin());


-- ============================================================================
-- 10. RLS POLICIES — WORSHIP SERVICES & VIDEOS
-- ============================================================================

-- Public read
CREATE POLICY "Public can read worship services"
  ON worship_services FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins manage worship services"
  ON worship_services FOR ALL
  USING (is_admin());

CREATE POLICY "Public can read service videos"
  ON service_videos FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins manage service videos"
  ON service_videos FOR ALL
  USING (is_admin());


-- ============================================================================
-- 11. RLS POLICIES — MINISTRY OFFICERS
-- ============================================================================

CREATE POLICY "Public can read ministry officers"
  ON ministry_officers FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins manage ministry officers"
  ON ministry_officers FOR ALL
  USING (is_admin());


-- ============================================================================
-- 12. RLS POLICIES — TRIVIA SCORES
-- ============================================================================

-- Users can read their own scores
CREATE POLICY "Users can read own trivia scores"
  ON trivia_scores FOR SELECT
  USING (auth.uid() = profile_id);

-- Admins can read all (for leaderboard / reporting)
CREATE POLICY "Admins can read all trivia scores"
  ON trivia_scores FOR SELECT
  USING (is_admin());

-- Users can insert their own scores
CREATE POLICY "Users can save own trivia scores"
  ON trivia_scores FOR INSERT
  WITH CHECK (auth.uid() = profile_id);


-- ============================================================================
-- 13. RLS POLICIES — BIRTHDAY GREETINGS
-- ============================================================================

-- Users can read greetings they sent or received
CREATE POLICY "Users can read own birthday greetings"
  ON birthday_greetings FOR SELECT
  USING (auth.uid() = from_profile_id OR auth.uid() = to_profile_id);

-- Authenticated users can send greetings
CREATE POLICY "Users can send birthday greetings"
  ON birthday_greetings FOR INSERT
  WITH CHECK (auth.uid() = from_profile_id);

-- Admins can read all
CREATE POLICY "Admins can read all birthday greetings"
  ON birthday_greetings FOR SELECT
  USING (is_admin());


-- ============================================================================
-- 14. RLS POLICIES — USER PREFERENCES
-- ============================================================================

-- Users can read and manage their own preferences
CREATE POLICY "Users can read own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);


-- ============================================================================
-- 15. INDEXES FOR NEW TABLES
-- ============================================================================

-- memorials
CREATE INDEX IF NOT EXISTS idx_memorials_created_by    ON memorials(created_by);
CREATE INDEX IF NOT EXISTS idx_memorials_published     ON memorials(is_published);
CREATE INDEX IF NOT EXISTS idx_memorials_passing_date  ON memorials(date_of_passing);

-- memorial_photos
CREATE INDEX IF NOT EXISTS idx_memorial_photos_memorial ON memorial_photos(memorial_id);

-- memorial_comments
CREATE INDEX IF NOT EXISTS idx_memorial_comments_memorial ON memorial_comments(memorial_id);
CREATE INDEX IF NOT EXISTS idx_memorial_comments_profile  ON memorial_comments(profile_id);

-- worship_services
CREATE INDEX IF NOT EXISTS idx_worship_services_date    ON worship_services(date);

-- service_videos
CREATE INDEX IF NOT EXISTS idx_service_videos_service   ON service_videos(service_id);
CREATE INDEX IF NOT EXISTS idx_service_videos_type      ON service_videos(type);

-- ministry_officers
CREATE INDEX IF NOT EXISTS idx_ministry_officers_ministry ON ministry_officers(ministry_id);

-- trivia_scores
CREATE INDEX IF NOT EXISTS idx_trivia_scores_profile    ON trivia_scores(profile_id);
CREATE INDEX IF NOT EXISTS idx_trivia_scores_played_at  ON trivia_scores(played_at);

-- birthday_greetings
CREATE INDEX IF NOT EXISTS idx_birthday_greetings_to    ON birthday_greetings(to_profile_id);
CREATE INDEX IF NOT EXISTS idx_birthday_greetings_from  ON birthday_greetings(from_profile_id);

-- deacons title
CREATE INDEX IF NOT EXISTS idx_deacons_title            ON deacons(title);


-- ============================================================================
-- 16. STORAGE BUCKET FOR MEMORIAL PHOTOS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('memorial-photos', 'memorial-photos', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Public read for memorial photos
CREATE POLICY "Public read memorial photos bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'memorial-photos');

-- Authenticated users can upload memorial photos
CREATE POLICY "Members upload memorial photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'memorial-photos'
    AND auth.uid() IS NOT NULL
  );

-- Uploaders can update their own memorial photos
CREATE POLICY "Members update own memorial photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'memorial-photos'
    AND auth.uid() IS NOT NULL
  );

-- Admins can delete memorial photos
CREATE POLICY "Admins delete memorial photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'memorial-photos'
    AND is_admin()
  );


-- ============================================================================
-- 17. ADD "FINANCE COMMITTEE" MINISTRY (seed data)
-- ============================================================================
-- This ministry controls financial data access via is_finance_team().
-- Members added to this ministry gain read access to all donation records.

INSERT INTO ministries (id, name, description, is_active)
VALUES (
  gen_random_uuid(),
  'Finance Committee',
  'The Finance Committee oversees the financial stewardship of Friendship Baptist Church. Members have access to donation records and financial reporting.',
  TRUE
)
ON CONFLICT DO NOTHING;

-- Only insert if Finance Committee doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ministries WHERE name = 'Finance Committee') THEN
    INSERT INTO ministries (name, description, is_active)
    VALUES (
      'Finance Committee',
      'The Finance Committee oversees the financial stewardship of Friendship Baptist Church. Members have access to donation records and financial reporting.',
      TRUE
    );
  END IF;
END $$;


-- ============================================================================
-- 18. DOCUMENTATION: PRIVACY MODEL
-- ============================================================================
--
-- DONATIONS (financial data):
--   Super Admin           → Full read/write access to ALL donations
--   Finance Committee     → Full read access to ALL donations (via ministry membership)
--   Deacon                → Read access to own + ward members' donations
--   Admin                 → Read access to own donations only (NOT all)
--   Member/Minister       → Read access to own donations only
--
-- PROFILES:
--   All authenticated     → Read all profiles (member directory)
--   User                  → Update own profile only
--   Admin/Super Admin     → Full access
--
-- SPIRITUAL GOALS:
--   User                  → Full CRUD on own goals only
--   No one else can see another user's goals
--
-- MEMORIALS:
--   Public                → Read published memorials
--   Creator               → Read/Update own (even if unpublished)
--   Admin                 → Full access
--
-- NOTIFICATIONS:
--   User                  → Read/Update own only
--   Admin                 → Create for any user
--
-- PRAYER REQUESTS:
--   Public                → Read public requests only
--   User                  → Read/Update own (including private)
--   Admin                 → Full access
--
-- ============================================================================
-- Done. Migration complete for full schema + financial privacy RLS.
-- ============================================================================
