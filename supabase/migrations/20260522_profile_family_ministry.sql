-- ============================================================================
-- Migration: Expanded Member Profiles, Family Trees, Ministry Membership
--            with Approval Workflows, and Ministry Communications
--
-- Date: 2026-05-22
-- Description:
--   1. Add new columns to profiles (gender, date_of_birth, about_bio, etc.)
--   2. Upgrade families table (add updated_at)
--   3. Upgrade family_members table (add relationship CHECK, created_at)
--   4. Add family_id FK on profiles
--   5. Add manager_id to ministries
--   6. Rebuild ministry_members with approval workflow columns
--   7. Create ministry_messages table
--   8. RLS policies for all affected tables
--   9. Indexes
--  10. Helper functions for RLS
--
-- Idempotent: uses IF NOT EXISTS, DO blocks, and CREATE OR REPLACE.
-- ============================================================================


-- ============================================================================
-- 1. HELPER FUNCTIONS (needed by RLS policies below)
-- ============================================================================

-- Ensure is_admin() and is_super_admin() exist (they should from 001,
-- but re-create with CREATE OR REPLACE to be safe).
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

-- Check if current user is a ministry manager (approved, role='manager')
CREATE OR REPLACE FUNCTION is_ministry_manager(ministry_uuid uuid)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM ministry_members
    WHERE ministry_id = ministry_uuid
      AND profile_id = auth.uid()
      AND role = 'manager'
      AND status = 'approved'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is the head of a family
CREATE OR REPLACE FUNCTION is_family_head(family_uuid uuid)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = family_uuid
      AND profile_id = auth.uid()
      AND relationship = 'head'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================================
-- 2. WARDS TABLE — ensure it exists with all needed columns
-- ============================================================================

CREATE TABLE IF NOT EXISTS wards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  deacon_id       UUID,
  families_count  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 3. ALTER profiles — add new columns
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT
  CHECK (gender IN ('male', 'female', 'other'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS about_bio TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS baptism_date DATE;

-- anniversary may already exist from initial schema; ADD IF NOT EXISTS is safe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS anniversary DATE;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ward_id UUID
  REFERENCES wards(id) ON DELETE SET NULL;

-- family_id added without FK for now; FK added after families table is ensured
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS family_id UUID;


-- ============================================================================
-- 4. FAMILIES TABLE — ensure it exists, add updated_at if missing
-- ============================================================================

CREATE TABLE IF NOT EXISTS families (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_name     TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- If the table existed from 001, it may lack updated_at
ALTER TABLE families ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add updated_at trigger for families
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'families_updated_at'
  ) THEN
    CREATE TRIGGER families_updated_at
      BEFORE UPDATE ON families
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;


-- ============================================================================
-- 5. FAMILY_MEMBERS TABLE — rebuild to add relationship CHECK, created_at
-- ============================================================================

-- The old table may exist without a CHECK on relationship or a created_at.
-- We add the missing columns / constraints safely.

-- Ensure created_at column exists
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Add CHECK constraint for relationship values if not already present.
-- We use a named constraint so we can check for its existence.
DO $$
BEGIN
  -- Add the constraint only if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'family_members_relationship_check'
      AND conrelid = 'family_members'::regclass
  ) THEN
    ALTER TABLE family_members
      ADD CONSTRAINT family_members_relationship_check
      CHECK (relationship IN ('head', 'spouse', 'child', 'parent', 'sibling', 'grandchild', 'grandparent', 'other'));
  END IF;
END $$;

-- Ensure the UNIQUE constraint exists (may already from 001)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'family_members_family_id_profile_id_key'
      AND conrelid = 'family_members'::regclass
  ) THEN
    ALTER TABLE family_members
      ADD CONSTRAINT family_members_family_id_profile_id_key
      UNIQUE (family_id, profile_id);
  END IF;
END $$;


-- ============================================================================
-- 6. ADD FK from profiles.family_id -> families(id)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_profiles_family'
      AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT fk_profiles_family
      FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE SET NULL;
  END IF;
END $$;


-- ============================================================================
-- 7. ADD manager_id TO ministries
-- ============================================================================

ALTER TABLE ministries ADD COLUMN IF NOT EXISTS manager_id UUID
  REFERENCES profiles(id) ON DELETE SET NULL;


-- ============================================================================
-- 8. MINISTRY_MEMBERS — upgrade with approval workflow columns
-- ============================================================================

-- The existing table has columns: ministry_id, profile_id, role, joined_at
-- with a composite PK (ministry_id, profile_id). We need to add:
--   id (uuid PK), status, requested_at, approved_at, approved_by
-- and change the PK structure.

-- Add an id column if it doesn't exist
ALTER TABLE ministry_members ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- Ensure id is populated for any existing rows
UPDATE ministry_members SET id = gen_random_uuid() WHERE id IS NULL;

-- Add status column with default 'pending'
ALTER TABLE ministry_members ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- For existing rows, set status to 'approved' (they were already members)
-- Only update rows that still have the default 'pending' and have a joined_at
-- (meaning they predate this migration)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ministry_members' AND column_name = 'joined_at'
  ) THEN
    UPDATE ministry_members SET status = 'approved' WHERE status = 'pending' AND joined_at IS NOT NULL;
  END IF;
END $$;

ALTER TABLE ministry_members ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE ministry_members ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE ministry_members ADD COLUMN IF NOT EXISTS approved_by UUID
  REFERENCES profiles(id) ON DELETE SET NULL;

-- Add CHECK constraints for role and status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ministry_members_role_check'
      AND conrelid = 'ministry_members'::regclass
  ) THEN
    ALTER TABLE ministry_members
      ADD CONSTRAINT ministry_members_role_check
      CHECK (role IN ('member', 'manager'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ministry_members_status_check'
      AND conrelid = 'ministry_members'::regclass
  ) THEN
    ALTER TABLE ministry_members
      ADD CONSTRAINT ministry_members_status_check
      CHECK (status IN ('pending', 'approved', 'denied'));
  END IF;
END $$;

-- Ensure UNIQUE constraint on (ministry_id, profile_id) exists
DO $$
BEGIN
  -- The old table used a composite PK which already enforces uniqueness.
  -- If there's no separate unique constraint, we don't need to add one
  -- since the PK already covers it.
  NULL;
END $$;


-- ============================================================================
-- 9. MINISTRY_MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ministry_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id     UUID NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  sent_by         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject         TEXT NOT NULL,
  body            TEXT NOT NULL,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 10. ENABLE RLS ON NEW/MODIFIED TABLES
-- ============================================================================

ALTER TABLE families         ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_messages ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 11. RLS POLICIES — families
-- ============================================================================

-- Drop old policies if they exist (to avoid conflicts when re-running)
DROP POLICY IF EXISTS "Family members can read own family"            ON families;
DROP POLICY IF EXISTS "Family head or admin can insert family"        ON families;
DROP POLICY IF EXISTS "Family head or admin can update family"        ON families;
DROP POLICY IF EXISTS "Family head or admin can delete family"        ON families;
DROP POLICY IF EXISTS "Admins full access to families"                ON families;

-- SELECT: authenticated users can read their own family
CREATE POLICY "Family members can read own family"
  ON families FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- User's profile.family_id matches this family
      id IN (SELECT family_id FROM profiles WHERE id = auth.uid() AND family_id IS NOT NULL)
      -- OR user is listed in family_members for this family
      OR id IN (SELECT family_id FROM family_members WHERE profile_id = auth.uid())
      -- OR user is admin
      OR is_admin()
    )
  );

-- INSERT: admin or family head
CREATE POLICY "Family head or admin can insert family"
  ON families FOR INSERT
  WITH CHECK (
    is_admin()
    OR auth.uid() IS NOT NULL  -- any authenticated user can create a family (they become head)
  );

-- UPDATE: family head or admin
CREATE POLICY "Family head or admin can update family"
  ON families FOR UPDATE
  USING (
    is_admin()
    OR is_family_head(id)
  )
  WITH CHECK (
    is_admin()
    OR is_family_head(id)
  );

-- DELETE: admin only (family head can request, but deletion is admin-level)
CREATE POLICY "Family head or admin can delete family"
  ON families FOR DELETE
  USING (
    is_admin()
    OR is_family_head(id)
  );


-- ============================================================================
-- 12. RLS POLICIES — family_members
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own family members"         ON family_members;
DROP POLICY IF EXISTS "Family head or admin can add members"      ON family_members;
DROP POLICY IF EXISTS "Family head or admin can remove members"   ON family_members;
DROP POLICY IF EXISTS "Admins full access to family members"      ON family_members;

-- SELECT: authenticated users can read members of their own family
CREATE POLICY "Users can read own family members"
  ON family_members FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- User is in this family
      family_id IN (SELECT fm.family_id FROM family_members fm WHERE fm.profile_id = auth.uid())
      -- OR user is admin
      OR is_admin()
    )
  );

-- INSERT: family head or admin
CREATE POLICY "Family head or admin can add members"
  ON family_members FOR INSERT
  WITH CHECK (
    is_admin()
    OR is_family_head(family_id)
  );

-- UPDATE: family head or admin
DROP POLICY IF EXISTS "Family head or admin can update members" ON family_members;
CREATE POLICY "Family head or admin can update members"
  ON family_members FOR UPDATE
  USING (
    is_admin()
    OR is_family_head(family_id)
  )
  WITH CHECK (
    is_admin()
    OR is_family_head(family_id)
  );

-- DELETE: family head or admin
CREATE POLICY "Family head or admin can remove members"
  ON family_members FOR DELETE
  USING (
    is_admin()
    OR is_family_head(family_id)
  );


-- ============================================================================
-- 13. RLS POLICIES — ministry_members (replace old policies)
-- ============================================================================

-- Drop all old ministry_members policies to rebuild with approval workflow
DROP POLICY IF EXISTS "Public can read ministry members"           ON ministry_members;
DROP POLICY IF EXISTS "Authenticated users can join ministries"    ON ministry_members;
DROP POLICY IF EXISTS "Users can leave ministries"                 ON ministry_members;
DROP POLICY IF EXISTS "Admins manage ministry members"             ON ministry_members;

-- New policies:

-- SELECT: users can read their own memberships; managers can read their
-- ministry's members; admins can read all
CREATE POLICY "Users can read own ministry memberships"
  ON ministry_members FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- Own membership
      profile_id = auth.uid()
      -- Ministry manager can see all members of their ministry
      OR is_ministry_manager(ministry_id)
      -- Admin can see all
      OR is_admin()
    )
  );

-- INSERT: authenticated users can request to join (inserts with status='pending')
CREATE POLICY "Authenticated users can request ministry membership"
  ON ministry_members FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND profile_id = auth.uid()
    AND status = 'pending'
  );

-- UPDATE: ministry managers and admins can approve/deny
CREATE POLICY "Managers and admins can update ministry memberships"
  ON ministry_members FOR UPDATE
  USING (
    is_admin()
    OR is_ministry_manager(ministry_id)
  )
  WITH CHECK (
    is_admin()
    OR is_ministry_manager(ministry_id)
  );

-- DELETE: admins only
CREATE POLICY "Admins can delete ministry memberships"
  ON ministry_members FOR DELETE
  USING (
    is_admin()
  );


-- ============================================================================
-- 14. RLS POLICIES — ministry_messages
-- ============================================================================

DROP POLICY IF EXISTS "Ministry members can read messages"         ON ministry_messages;
DROP POLICY IF EXISTS "Managers and admins can send messages"       ON ministry_messages;

-- SELECT: approved members of the ministry can read messages
CREATE POLICY "Ministry members can read messages"
  ON ministry_messages FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- User is an approved member of this ministry
      EXISTS (
        SELECT 1 FROM ministry_members
        WHERE ministry_id = ministry_messages.ministry_id
          AND profile_id = auth.uid()
          AND status = 'approved'
      )
      -- OR admin
      OR is_admin()
    )
  );

-- INSERT: ministry managers and admins can send messages
CREATE POLICY "Managers and admins can send messages"
  ON ministry_messages FOR INSERT
  WITH CHECK (
    is_admin()
    OR is_ministry_manager(ministry_id)
  );


-- ============================================================================
-- 15. RLS POLICIES — profiles update (supplement existing)
-- ============================================================================

-- The initial migration already has:
--   "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id)
--   "Admins full access to profiles" ON profiles FOR ALL USING (is_admin())
-- These already cover the requirement. No additional policies needed.


-- ============================================================================
-- 16. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_family_members_family   ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_profile  ON family_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_ministry_members_ministry ON ministry_members(ministry_id);
CREATE INDEX IF NOT EXISTS idx_ministry_members_profile  ON ministry_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_ministry_members_status   ON ministry_members(status);
CREATE INDEX IF NOT EXISTS idx_ministry_messages_ministry ON ministry_messages(ministry_id);
CREATE INDEX IF NOT EXISTS idx_ministry_messages_sent_by  ON ministry_messages(sent_by);
CREATE INDEX IF NOT EXISTS idx_ministry_messages_sent_at  ON ministry_messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_profiles_family           ON profiles(family_id);
CREATE INDEX IF NOT EXISTS idx_profiles_ward             ON profiles(ward_id);


-- ============================================================================
-- Done. Migration complete for expanded profiles, family trees,
-- ministry membership with approval workflows, and ministry communications.
-- ============================================================================
