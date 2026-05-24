-- ============================================================================
-- Migration: Add musician role + member approval workflow
-- Date: 2026-05-24
-- ============================================================================

-- 1. Add 'musician' to user_role enum
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'musician' AFTER 'minister';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add approval fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 3. Auto-approve existing members (they're already active)
UPDATE profiles SET is_approved = TRUE, is_email_verified = TRUE
WHERE is_approved IS NULL OR is_approved = FALSE;

-- Index for admin approval queue
CREATE INDEX IF NOT EXISTS idx_profiles_approval ON profiles(is_approved, is_email_verified);
