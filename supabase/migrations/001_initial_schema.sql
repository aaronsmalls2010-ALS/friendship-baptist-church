-- ============================================================================
-- Friendship Baptist Church — Complete Initial Schema
-- Supabase Migration 001
--
-- Tables, indexes, RLS policies, triggers, helper functions, storage buckets.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Custom ENUM types
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('member','deacon','minister','admin','super_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE prayer_status AS ENUM ('pending','praying','answered');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE donation_type AS ENUM ('tithe','offering','building_fund','mission','other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE track_type AS ENUM ('worship','hymn','choir','gospel');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE goal_type AS ENUM ('bible_reading','prayer','service_hours','giving','fasting','study');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE goal_period AS ENUM ('weekly','monthly','yearly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('event','announcement','ministry','prayer','system');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- 2. HELPER FUNCTIONS (used by RLS policies — must be created first)
-- ============================================================================

-- Current user is admin or super_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Current user is super_admin only
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 3a. profiles — extends auth.users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  first_name      TEXT NOT NULL DEFAULT '',
  last_name       TEXT NOT NULL DEFAULT '',
  phone           TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  zip             TEXT,
  photo_url       TEXT,
  role            user_role NOT NULL DEFAULT 'member',
  birthday        DATE,
  anniversary     DATE,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3b. wards
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  deacon_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  families_count  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3c. deacons
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deacons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  ward_id         UUID REFERENCES wards(id) ON DELETE SET NULL,
  ordained_date   DATE,
  bio             TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3d. ministries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ministries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  leader_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  schedule        TEXT,
  image_url       TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3e. ministry_members (junction)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ministry_members (
  ministry_id     UUID NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'member',
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (ministry_id, profile_id)
);

-- ---------------------------------------------------------------------------
-- 3f. events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  start_date      TIMESTAMPTZ NOT NULL,
  end_date        TIMESTAMPTZ,
  location        TEXT,
  ministry_id     UUID REFERENCES ministries(id) ON DELETE SET NULL,
  image_url       TEXT,
  rsvp_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3g. event_rsvps (junction)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_rsvps (
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, profile_id)
);

-- ---------------------------------------------------------------------------
-- 3h. sermons
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sermons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  speaker         TEXT NOT NULL DEFAULT '',
  date            DATE NOT NULL,
  scripture       TEXT,
  audio_url       TEXT,
  video_url       TEXT,
  transcript      TEXT,
  topics          TEXT[] NOT NULL DEFAULT '{}',
  duration        INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3i. music_tracks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS music_tracks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  artist          TEXT NOT NULL,
  album           TEXT,
  audio_url       TEXT NOT NULL,
  duration        INTEGER NOT NULL DEFAULT 0,
  track_type      track_type NOT NULL DEFAULT 'worship',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3j. announcements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  start_date      TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date        TIMESTAMPTZ,
  is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
  category        TEXT,
  ministry_id     UUID REFERENCES ministries(id) ON DELETE SET NULL,
  image_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3k. prayer_requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prayer_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  request         TEXT NOT NULL,
  is_public       BOOLEAN NOT NULL DEFAULT FALSE,
  status          prayer_status NOT NULL DEFAULT 'pending',
  category        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3l. donations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount            NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  donation_type     donation_type NOT NULL DEFAULT 'tithe',
  campaign          TEXT,
  stripe_payment_id TEXT,
  is_recurring      BOOLEAN NOT NULL DEFAULT FALSE,
  date              TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3m. businesses (member business directory)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS businesses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  owner_name      TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT '',
  phone           TEXT,
  email           TEXT,
  website         TEXT,
  address         TEXT,
  image_url       TEXT,
  is_approved     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3n. devotionals
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS devotionals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  scripture       TEXT NOT NULL DEFAULT '',
  scripture_text  TEXT NOT NULL DEFAULT '',
  body            TEXT NOT NULL,
  author          TEXT NOT NULL DEFAULT '',
  date            DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3o. spiritual_goals
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS spiritual_goals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            goal_type NOT NULL,
  title           TEXT NOT NULL,
  target          INTEGER NOT NULL DEFAULT 0,
  current         INTEGER NOT NULL DEFAULT 0,
  period          goal_period NOT NULL DEFAULT 'weekly',
  is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3p. notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  type            notification_type NOT NULL DEFAULT 'system',
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  action_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3q. timeline_events (church history)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS timeline_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year            INTEGER NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  image_url       TEXT,
  "order"         INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- 3r. testimonies
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS testimonies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name     TEXT NOT NULL,
  content         TEXT NOT NULL,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  is_approved     BOOLEAN NOT NULL DEFAULT FALSE,
  photo_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3s. site_content (CMS key-value content blocks)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_content (
  id              TEXT PRIMARY KEY,
  content         TEXT NOT NULL,
  content_type    TEXT NOT NULL DEFAULT 'text'
                    CHECK (content_type IN ('text','richtext','image')),
  page            TEXT NOT NULL,
  section         TEXT NOT NULL,
  label           TEXT NOT NULL DEFAULT '',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by      UUID REFERENCES auth.users(id)
);

-- ---------------------------------------------------------------------------
-- 3t. audit_log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  resource_type   TEXT NOT NULL,
  resource_id     TEXT,
  metadata        JSONB DEFAULT '{}',
  ip_address      INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 4. INDEXES
-- ============================================================================

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role       ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email      ON profiles(email);

-- wards
CREATE INDEX IF NOT EXISTS idx_wards_deacon_id     ON wards(deacon_id);

-- deacons
CREATE INDEX IF NOT EXISTS idx_deacons_profile_id  ON deacons(profile_id);
CREATE INDEX IF NOT EXISTS idx_deacons_ward_id     ON deacons(ward_id);
CREATE INDEX IF NOT EXISTS idx_deacons_is_active   ON deacons(is_active);

-- ministries
CREATE INDEX IF NOT EXISTS idx_ministries_leader_id  ON ministries(leader_id);
CREATE INDEX IF NOT EXISTS idx_ministries_is_active  ON ministries(is_active);

-- ministry_members
CREATE INDEX IF NOT EXISTS idx_ministry_members_profile ON ministry_members(profile_id);

-- events
CREATE INDEX IF NOT EXISTS idx_events_start_date     ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_is_published   ON events(is_published);
CREATE INDEX IF NOT EXISTS idx_events_ministry_id    ON events(ministry_id);

-- event_rsvps
CREATE INDEX IF NOT EXISTS idx_event_rsvps_profile   ON event_rsvps(profile_id);

-- sermons
CREATE INDEX IF NOT EXISTS idx_sermons_date          ON sermons(date);
CREATE INDEX IF NOT EXISTS idx_sermons_speaker       ON sermons(speaker);

-- music_tracks
CREATE INDEX IF NOT EXISTS idx_music_tracks_type     ON music_tracks(track_type);

-- announcements
CREATE INDEX IF NOT EXISTS idx_announcements_dates   ON announcements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned  ON announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_ministry ON announcements(ministry_id);

-- prayer_requests
CREATE INDEX IF NOT EXISTS idx_prayer_requests_status    ON prayer_requests(status);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_public    ON prayer_requests(is_public);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_profile   ON prayer_requests(profile_id);

-- donations
CREATE INDEX IF NOT EXISTS idx_donations_profile     ON donations(profile_id);
CREATE INDEX IF NOT EXISTS idx_donations_date        ON donations(date);
CREATE INDEX IF NOT EXISTS idx_donations_type        ON donations(donation_type);
CREATE INDEX IF NOT EXISTS idx_donations_stripe      ON donations(stripe_payment_id);

-- businesses
CREATE INDEX IF NOT EXISTS idx_businesses_approved   ON businesses(is_approved);
CREATE INDEX IF NOT EXISTS idx_businesses_category   ON businesses(category);

-- devotionals
CREATE INDEX IF NOT EXISTS idx_devotionals_date      ON devotionals(date);

-- spiritual_goals
CREATE INDEX IF NOT EXISTS idx_goals_profile         ON spiritual_goals(profile_id);
CREATE INDEX IF NOT EXISTS idx_goals_completed       ON spiritual_goals(is_completed);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_profile ON notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read    ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type    ON notifications(type);

-- timeline_events
CREATE INDEX IF NOT EXISTS idx_timeline_year         ON timeline_events(year);
CREATE INDEX IF NOT EXISTS idx_timeline_order        ON timeline_events("order");

-- testimonies
CREATE INDEX IF NOT EXISTS idx_testimonies_approved  ON testimonies(is_approved);
CREATE INDEX IF NOT EXISTS idx_testimonies_date      ON testimonies(date);

-- site_content
CREATE INDEX IF NOT EXISTS idx_site_content_page     ON site_content(page);
CREATE INDEX IF NOT EXISTS idx_site_content_section  ON site_content(page, section);

-- audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_user        ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource    ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created     ON audit_log(created_at);


-- ============================================================================
-- 5. TRIGGER FUNCTIONS
-- ============================================================================

-- 5a. Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER site_content_updated_at
  BEFORE UPDATE ON site_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5b. Auto-create profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================================
-- 6. ROW LEVEL SECURITY — Enable on every table
-- ============================================================================

ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards            ENABLE ROW LEVEL SECURITY;
ALTER TABLE deacons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_tracks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE devotionals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE spiritual_goals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonies      ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log        ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 7. RLS POLICIES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 7a. profiles
-- ---------------------------------------------------------------------------
-- Anyone authenticated can read all profiles (member directory)
CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT
  USING (TRUE);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins have full access
CREATE POLICY "Admins full access to profiles"
  ON profiles FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 7b. ministries — public read, admin write
-- ---------------------------------------------------------------------------
CREATE POLICY "Public can read ministries"
  ON ministries FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins manage ministries"
  ON ministries FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 7c. ministry_members
-- ---------------------------------------------------------------------------
CREATE POLICY "Public can read ministry members"
  ON ministry_members FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can join ministries"
  ON ministry_members FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can leave ministries"
  ON ministry_members FOR DELETE
  USING (auth.uid() = profile_id);

CREATE POLICY "Admins manage ministry members"
  ON ministry_members FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 7d. events — public read published, admin write
-- ---------------------------------------------------------------------------
CREATE POLICY "Public can read published events"
  ON events FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Admins can read all events"
  ON events FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins manage events"
  ON events FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 7e. event_rsvps
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can read own RSVPs"
  ON event_rsvps FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Authenticated users can RSVP"
  ON event_rsvps FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can cancel own RSVP"
  ON event_rsvps FOR DELETE
  USING (auth.uid() = profile_id);

CREATE POLICY "Admins manage RSVPs"
  ON event_rsvps FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 7f. sermons — public read, admin write
-- ---------------------------------------------------------------------------
CREATE POLICY "Public can read sermons"
  ON sermons FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins manage sermons"
  ON sermons FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 7g. music_tracks — public read, admin write
-- ---------------------------------------------------------------------------
CREATE POLICY "Public can read music tracks"
  ON music_tracks FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins manage music tracks"
  ON music_tracks FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 7h. announcements — public read, admin write
-- ---------------------------------------------------------------------------
CREATE POLICY "Public can read announcements"
  ON announcements FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins manage announcements"
  ON announcements FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 7i. prayer_requests
-- ---------------------------------------------------------------------------
-- Public can read public prayer requests
CREATE POLICY "Public can read public prayer requests"
  ON prayer_requests FOR SELECT
  USING (is_public = TRUE);

-- Authenticated users can see their own (including private ones)
CREATE POLICY "Users can read own prayer requests"
  ON prayer_requests FOR SELECT
  USING (auth.uid() = profile_id);

-- Authenticated users can create prayer requests
CREATE POLICY "Authenticated users can create prayer requests"
  ON prayer_requests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own prayer requests
CREATE POLICY "Users can update own prayer requests"
  ON prayer_requests FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Admins manage all prayer requests
CREATE POLICY "Admins manage prayer requests"
  ON prayer_requests FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 7j. donations — users see own, admins see all
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can read own donations"
  ON donations FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Authenticated users can create donations"
  ON donations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage donations"
  ON donations FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 7k. spiritual_goals — users manage own
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can read own goals"
  ON spiritual_goals FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can create own goals"
  ON spiritual_goals FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own goals"
  ON spiritual_goals FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete own goals"
  ON spiritual_goals FOR DELETE
  USING (auth.uid() = profile_id);

-- ---------------------------------------------------------------------------
-- 7l. notifications — users see own, admins can create
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Admins can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins manage notifications"
  ON notifications FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 7m. devotionals — public read, admin write
-- ---------------------------------------------------------------------------
CREATE POLICY "Public can read devotionals"
  ON devotionals FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins manage devotionals"
  ON devotionals FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 7n. businesses — public read approved, authenticated create, admin manage
-- ---------------------------------------------------------------------------
CREATE POLICY "Public can read approved businesses"
  ON businesses FOR SELECT
  USING (is_approved = TRUE);

CREATE POLICY "Admins can read all businesses"
  ON businesses FOR SELECT
  USING (is_admin());

CREATE POLICY "Authenticated users can submit business"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage businesses"
  ON businesses FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 7o. testimonies — public read approved, authenticated create, admin manage
-- ---------------------------------------------------------------------------
CREATE POLICY "Public can read approved testimonies"
  ON testimonies FOR SELECT
  USING (is_approved = TRUE);

CREATE POLICY "Admins can read all testimonies"
  ON testimonies FOR SELECT
  USING (is_admin());

CREATE POLICY "Authenticated users can submit testimony"
  ON testimonies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage testimonies"
  ON testimonies FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 7p. wards — public read, admin write
-- ---------------------------------------------------------------------------
CREATE POLICY "Public can read wards"
  ON wards FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins manage wards"
  ON wards FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 7q. deacons — public read, admin write
-- ---------------------------------------------------------------------------
CREATE POLICY "Public can read deacons"
  ON deacons FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins manage deacons"
  ON deacons FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 7r. timeline_events — public read, admin write
-- ---------------------------------------------------------------------------
CREATE POLICY "Public can read timeline events"
  ON timeline_events FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins manage timeline events"
  ON timeline_events FOR ALL
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 7s. site_content — public read, super_admin write
-- ---------------------------------------------------------------------------
CREATE POLICY "Public can read site content"
  ON site_content FOR SELECT
  USING (TRUE);

CREATE POLICY "Super admins manage site content"
  ON site_content FOR ALL
  USING (is_super_admin());

-- ---------------------------------------------------------------------------
-- 7t. audit_log — admins only
-- ---------------------------------------------------------------------------
CREATE POLICY "Admins can read audit log"
  ON audit_log FOR SELECT
  USING (is_admin());

CREATE POLICY "System can insert audit log"
  ON audit_log FOR INSERT
  WITH CHECK (TRUE);


-- ============================================================================
-- 8. SUPABASE STORAGE BUCKETS & POLICIES
-- ============================================================================

-- Create buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars',    'avatars',    TRUE),
  ('media',      'media',      TRUE),
  ('cms-images', 'cms-images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8a. avatars bucket policies
-- ---------------------------------------------------------------------------
-- Anyone can view avatars (public bucket)
CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar (file path must start with their uid)
CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Users can update their own avatar
CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Users can delete their own avatar
CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- ---------------------------------------------------------------------------
-- 8b. media bucket policies (sermons, music, event images, etc.)
-- ---------------------------------------------------------------------------
-- Public read
CREATE POLICY "Public read media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- Admins can upload media
CREATE POLICY "Admins upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND is_admin()
  );

-- Admins can update media
CREATE POLICY "Admins update media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media'
    AND is_admin()
  );

-- Admins can delete media
CREATE POLICY "Admins delete media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media'
    AND is_admin()
  );

-- ---------------------------------------------------------------------------
-- 8c. cms-images bucket policies
-- ---------------------------------------------------------------------------
-- Public read
CREATE POLICY "Public read cms images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cms-images');

-- Super admins can upload CMS images
CREATE POLICY "Super admins upload cms images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cms-images'
    AND is_super_admin()
  );

-- Super admins can update CMS images
CREATE POLICY "Super admins update cms images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'cms-images'
    AND is_super_admin()
  );

-- Super admins can delete CMS images
CREATE POLICY "Super admins delete cms images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cms-images'
    AND is_super_admin()
  );


-- ============================================================================
-- Done. All tables, indexes, RLS policies, triggers, and storage buckets
-- have been created for the Friendship Baptist Church application.
-- ============================================================================
